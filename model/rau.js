import { readdir, readFile, unlink, writeFile } from "fs/promises";
import axios from "axios";

import { cmd, pause } from "../utils.js";
import { WORKERS_INFO_DIR, WORKERS_FILE_NAME_TEMPLATE } from "../config.js";
import { query } from "../db.js";

const toData = {
	"Measurements_parameters": (k, angle_corr, ch3mean_k, ch3mean_n, ch7mean_k, ch7mean_n) => ({
		"K": [ ...k ],
		"3UI angle correction": angle_corr,
		"Channel 3 mean": { "k": ch3mean_k, "n": ch3mean_n },
		"Channel 7 mean": { "k": ch7mean_k, "n": ch7mean_n }
	}),
	"RAU_parameters": (ip, snet, dgway, port, rcvtout, mac_enable, mac_addr, snum) => ({
		"IP Address": [ ...ip ],
		"Subnet Mask": [ ...snet ],
		"Default Gateway": [ ...dgway ],
		"Port": port,
		"Receive Timeout": rcvtout,
		"MAC": { "Enable": mac_enable ? 1 : 0, "Address": [ ...mac_addr ] },
		"Serial Number": snum
	}),
	"MAU_parameters": (mau_1_addr, mau_1_port, mau_2_addr, mau_2_port) => ({
		"MAU 1": { "Address": [ ...mau_1_addr ], "Port": mau_1_port },
		"MAU 2": { "Address": [ ...mau_2_addr ], "Port": mau_2_port },
	}),
	"Loopback_parameters": (u, i, f, fi) => ({
		"U": u,
		"I": i,
		"f": f,
		"fi": fi,
	}),
	"Sending_enable_command": enable => ({ "Value": enable ? 1 : 0 }),
	"Loopback_enable_command": enable => ({ "Value": enable ? 1 : 0 }),
	"SaveAll_command": enable => ({ "Value": enable ? 1 : 0 }),
	"Null_command": enable => ({ "Value": enable ? 1 : 0 }),
	"McuReset_command": enable => ({ "Value": enable ? 1 : 0 }),
};

const fromData = {
	"Measurements_parameters": data => ({
		k: [ ...data["K"] ],
		angle_corr: data["3UI angle correction"],
		ch3mean_k: data["Channel 3 mean"].k,
		ch3mean_n: data["Channel 3 mean"].n,
		ch7mean_k: data["Channel 7 mean"].k,
		ch7mean_n: data["Channel 7 mean"].n
	}),
	"RAU_parameters": data => ({
		ip: data["IP Address"].join("."),
		snet: data["Subnet Mask"].join("."),
		dgway: data["Default Gateway"].join("."),
		port: data["Port"],
		rcvtout: data["Receive Timeout"],
		mac_enable: data["MAC"]["Enable"] === 1,
		mac_addr: data["MAC"]["Address"].map(seg => seg.toString(16)).join("-"),
		snum: data["Serial Number"],
	}),
	"MAU_parameters": data => ({
		mau_1_addr: data["MAU 1"]["Address"].join("."),
		mau_1_port: data["MAU 1"]["Port"],
		mau_2_addr: data["MAU 2"]["Address"].join("."),
		mau_2_port: data["MAU 2"]["Port"],
	}),
	"Loopback_parameters": data => ({
		u: data["U"],
		i: data["I"],
		f: data["f"],
		fi: data["fi"],
	}),
	"ch_eff": data => ([ ...data["ch_eff"] ]),
	"ch_eff_raw": data => ([ ...data["ch_eff_raw"] ]),
	"ch_mean_raw": data => ([ ...data["ch_mean_raw"] ]),
};

const RAUSettingsSingle = ip => what => {
	const url = `http://${ip}/${what}`;
	const ret = {};
	if (fromData[what] !== undefined)
		ret.get = () => axios.get(url).then(({ data }) => fromData[what](data));
	if (toData[what] !== undefined)
		ret.post = data => axios.post(url, toData[what](data));
	return ret;
};

const getRAUSettings = ip => RAUSettingsSingle(ip)("Measurements_parameters").get()
	.then(pause(1))
	.then(res1 => RAUSettingsSingle(ip)("RAU_parameters").get().then(res2 => ({ ...res1, ...res2 })))
	.then(pause(1))
	.then(res1 => RAUSettingsSingle(ip)("MAU_parameters").get().then(res2 => ({ ...res1, ...res2 })));
/*
const getRAUFiles = () => readdir(WORKERS_INFO_DIR, { withFileTypes: true })
	.then(list => list
		.filter(f => f.isFile())
		.map(({ name }) => name)
		.filter(name => WORKERS_FILE_NAME_TEMPLATE.test(name))
	)
	.then(fnames => fnames
		.map(fname => readFile(`${WORKERS_INFO_DIR}${fname}`, "utf8"))
	)
	.then(proms => Promise.all(proms))
	.then(files => files
		.map(file => file
			.split("\n")
			.map(line => line.trim())
			.filter(line => line !== "")
			.reduce((acc, line) => {
				const arr = line.split("=");
				const m = arr[0].match(/^C_KOEF\[(\d)\]$/);
				let key;
				let value;
				if (m !== null) {
					key = "c_koef";
					value = [ ...(acc["c_koef"] ?? []) ];
					value[parseInt(m[1]) - 1] = parseFloat(arr[1]);
				} else if (["ID", "PORT", "EST_PSET_CHANNEL_NUMBER", "LOG_TIME_PERIOD"].includes(arr[0])) {
					key = arr[0].toLowerCase();
					value = parseInt(arr[1]);
				} else if (["C_CONS[I]", "C_CONS[U]", "SCALE_FACTOR[I]", "SCALE_FACTOR[U]", "P_SET_SCALE", "P_SET_OFFSET"].includes(arr[0])) {
					key = arr[0].toLowerCase().replace(/\[(.)\]/, "_$1");
					value = parseFloat(arr[1]);
				} else if (["ENABLED", "SAVE_OSCILLOGRAPHY"].includes(arr[0])) {
					key = arr[0].toLowerCase();
					value = arr[1] === "1";
				} else if ("IP" === arr[0]) {
					key = arr[0].toLowerCase();
					value = arr[1];
				}
				return key === undefined ? { ...acc } : { ...acc, [key]: value };
			}, {})
		)
		.reduce((acc, { id, ...rest }) => id === undefined ? { ...acc } : { ...acc, [id]: rest }, {})
	);
*/
const serviceRestart = () => cmd("systemctl stop krafttex_workers_3000.service")
	.then(pause(5))
	.then(() => cmd("systemctl start krafttex_workers_3000.service"));

const setRAUFile = ({ id, ip, port, enabled, save_oscillography, est_pset_channel_number, c_koef, c_cons_i, c_cons_u, scale_factor_i, scale_factor_u, p_set_scale, p_set_offset, log_time_period }) => {
	const file = [
		`ID=${id}`,
		`IP=${ip}`,
		`PORT=${port}`,
		`ENABLED=${enabled ? 1 : 0}`,
		`SAVE_OSCILLOGRAPHY=${save_oscillography ? 1 : 0}`,
		`EST_PSET_CHANNEL_NUMBER=${est_pset_channel_number}`,
		`${c_koef.map((e, i) => `C_KOEF[${i + 1}]=${e}`).join("\n")}`,
		`C_CONS[I]=${c_cons_i}`,
		`C_CONS[U]=${c_cons_u}`,
		`SCALE_FACTOR[I]=${scale_factor_i}`,
		`SCALE_FACTOR[U]=${scale_factor_u}`,
		`P_SET_SCALE=${p_set_scale}`,
		`P_SET_OFFSET=${p_set_offset}`,
		`LOG_TIME_PERIOD=${log_time_period}`
	].join("\n");
	return writeFile(`${WORKERS_INFO_DIR}RAUS${id}`, file)
		.then(() => serviceRestart());
};

const updateRAUDB = (id, data) => {
	const fields = Object.keys(data);
	if (fields.length === 0)
		return Promise.resolve(0);
	return query(`UPDATE raus.Tbl_RAU SET ${fields.map(field => `${field} = ?`).join(`,\n`)} WHERE id = ?;`, [ ...Object.values(data), id ])
		.then(res => `updated ${res.affectedRows} RAU`);
};
const insertRAUDB = data => {
	const fields = Object.keys(data);
	if (fields.length === 0)
		return Promise.resolve(null);
	return query(`INSERT INTO raus.Tbl_RAU(${fields.join(", ")})VALUES(${fields.map(() => "?").join(", ")}) RETURNING id;`, Object.values(data))
		.then(([ row ]) => row["id"]);
};

const deleteRAUDB = id => query("DELETE FROM raus.Tbl_RAU WHERE id = ?;", [ id ])
	.then(res => `deleted ${res.affectedRows} RAU`);

export const getRAU = id => id
	? query("SELECT id, rau_type_id, gen_id, is_master, started IS NOT NULL AS running, scale_factor_u, scale_factor_i, p_set_scale, p_set_offset, rau_conf FROM raus.Tbl_RAU WHERE id = ?;", [ id ])
		.then(rows => rows?.[0])
	: query("SELECT id, rau_type_id, gen_id, is_master, started IS NOT NULL AS running, scale_factor_u, scale_factor_i, p_set_scale, p_set_offset, rau_conf FROM raus.Tbl_RAU;");

export const updateRAU = (id, data) => getRAU(id)
	.then(({ rau_conf: rau_conf_old }) => {
		rau_conf_old = JSON.parse(rau_conf_old);
		const { mau_1_addr, mau_1_port, k, c_cons_i, c_cons_u, enabled } = rau_conf_old;
		const { rau_conf, is_master, scale_factor_i, scale_factor_u, p_set_scale, p_set_offset } = data;
		const { log_time_period, save_oscillography, est_pset_channel_number } = rau_conf;
		return updateRAUDB(id, { is_master, scale_factor_u, scale_factor_i, p_set_scale, p_set_offset, rau_conf: { ...rau_conf_old, ...rau_conf } })
			.then(res => setRAUFile({ id, ip: mau_1_addr, port: mau_1_port, enabled, save_oscillography, est_pset_channel_number, c_koef: k, c_cons_i, c_cons_u, scale_factor_i, scale_factor_u, p_set_scale, p_set_offset, log_time_period })
				.then(() => res)
			);
	});

export const insertRAU = data => {
	const { rau_type_id, gen_id, ip_rau, is_master, scale_factor_i, scale_factor_u, p_set_scale, p_set_offset, rau_conf } = data;
	const { log_time_period, est_pset_channel_number, save_oscillography } = rau_conf;
	return getRAUSettings(ip_rau)
		.then(({ dgway, mac_addr, mau_1_addr, mau_1_port, mau_2_addr, mau_2_port, port, k }) => {
			const c_cons_i = 1;
			const c_cons_u = 1;
			const rau_conf = { ip: ip_rau, dgway, mac_addr, mau_1_addr, mau_1_port, mau_2_addr, mau_2_port, port, k,
			                   c_cons_i, c_cons_u, log_time_period, enabled: 0, save_oscillography, est_pset_channel_number };
			return insertRAUDB({ rau_type_id, gen_id, rau_conf, is_master, scale_factor_i, scale_factor_u, p_set_scale, p_set_offset })
				.then(id => setRAUFile({ id, ip: mau_1_addr, port: mau_1_port, enabled: 0, save_oscillography, est_pset_channel_number, c_koef: k, c_cons_i, c_cons_u, scale_factor_i, scale_factor_u, p_set_scale, p_set_offset, log_time_period })
					.then(() => ({ id, rau_type_id, gen_id, rau_conf: { ip: ip_rau, dgway, mac_addr, mau_1_addr, mau_1_port, mau_2_addr, mau_2_port, port, log_time_period, enabled: 0, save_oscillography, est_pset_channel_number }, is_master, scale_factor_i, scale_factor_u, p_set_scale, p_set_offset }))
				);
		});
};

export const toggleRAU = (id, enabled) => getRAU(id)
	.then(({ rau_conf, is_master, scale_factor_i, scale_factor_u, p_set_scale, p_set_offset }) => {
		rau_conf = JSON.parse(rau_conf);
		rau_conf = { ...rau_conf, enabled};
		const { log_time_period, save_oscillography, est_pset_channel_number, mau_1_addr, mau_1_port, k, c_cons_i, c_cons_u } = rau_conf;
		return updateRAUDB(id, { rau_conf, started: enabled ? new Date() : null })
			.then(res => setRAUFile({ id, ip: mau_1_addr, port: mau_1_port, enabled, save_oscillography, est_pset_channel_number, c_koef: k, c_cons_i, c_cons_u, scale_factor_i, scale_factor_u, p_set_scale, p_set_offset, log_time_period })
				.then(() => res)
			);
	});

export const deleteRAU = id => deleteRAUDB(id)
	.then(() => unlink(`${WORKERS_INFO_DIR}RAUS${id}`)
		.then(() => serviceRestart())
	)
	.then(() => "deleted 1 RAU")
	.catch(() => "file not nound");

export const getRAUByGen = gen_id => query("SELECT * FROM raus.Tbl_RAU WHERE gen_id = ?;", [ gen_id ]);

export const getRAUType = (id = null) => id
	? query("SELECT id, type_name, type_description, conf_file FROM raus.Tbl_Rau_Type WHERE id = ?;", [ id ])
		.then(rows => rows?.[0])
	: query("SELECT id, type_name, type_description, conf_file FROM raus.Tbl_Rau_Type;");

export const deleteRAUType = id => query("DELETE FROM raus.Tbl_Rau_Type WHERE id = ?;", [ id ])
	.then(res => `deleted ${res.affectedRows} RAUtype`);

export const updateRAUType = (id, data) => {
	const fields = Object.keys(data);
	if (fields.length === 0)
		return Promise.resolve(0);
	return query(`UPDATE raus.Tbl_Rau_Type SET ${fields.map(field => `${field} = ?`).join(`,\n`)} WHERE id = ?;`, [ ...Object.values(data), id ])
		.then(res => `updated ${res.affectedRows} RAUtype`);
};

export const insertRAUType = data => {
	const fields = Object.keys(data);
	if (fields.length === 0)
		return Promise.resolve(null);
	return query(`INSERT INTO raus.Tbl_Rau_Type(${fields.join(", ")})VALUES(${fields.map(() => "?").join(", ")});`, Object.values(data))
		.then(res => `added ${res.affectedRows} RAUtype`);
};

export const getGenerator = (id = null) => id
	? query("SELECT id, name, central_id, fn_prefix, freq_nominal, pelec_nominal, db_min, db_max, droop_min, droop_max, rise_time_min, rise_time_max, p_set_min, p_set_max, psetp_min_difference_pu, pearson_max, rau_master_id, rau_slave_id FROM raus.Tbl_Generators_1 WHERE id = ?;", [ id ])
		.then(rows => rows?.[0])
	: query("SELECT id, name, central_id, fn_prefix, freq_nominal, pelec_nominal, db_min, db_max, droop_min, droop_max, rise_time_min, rise_time_max, p_set_min, p_set_max, psetp_min_difference_pu, pearson_max, rau_master_id, rau_slave_id FROM raus.Tbl_Generators_1;");

export const deleteGenerator = id => query("DELETE FROM raus.Tbl_Generators_1 WHERE id = ?;", [ id ])
	.then(res => `deleted ${res.affectedRows} generator`);

export const updateGenerator = (id, data) => {
	const fields = Object.keys(data);
	if (fields.length === 0)
		return Promise.resolve(0);
	return query(`UPDATE raus.Tbl_Generators_1 SET ${fields.map(field => `${field} = ?`).join(`,\n`)} WHERE id = ?;`, [ ...Object.values(data), id ])
		.then(res => `updated ${res.affectedRows} generator`);
};

export const insertGenerator = data => {
	const fields = Object.keys(data);
	if (fields.length === 0)
		return Promise.resolve(null);
	return query(`INSERT INTO raus.Tbl_Generators_1(${fields.join(", ")})VALUES(${fields.map(() => "?").join(", ")});`, Object.values(data))
		.then(res => `added ${res.affectedRows} generator`);
};

export const getCentral = (id = null) => id
	? query("SELECT id, cen_name, cen_address, cen_longitude, cen_latitude FROM raus.Tbl_Centrals WHERE id = ?;", [ id ])
		.then(rows => rows?.[0])
	: query("SELECT id, cen_name, cen_address, cen_longitude, cen_latitude FROM raus.Tbl_Centrals;");

export const deleteCentral = id => query("DELETE FROM raus.Tbl_Centrals WHERE id = ?;", [ id ])
	.then(res => `deleted ${res.affectedRows} central`);

export const updateCentral = (id, data) => {
	const fields = Object.keys(data);
	if (fields.length === 0)
		return Promise.resolve(0);
	return query(`UPDATE raus.Tbl_Centrals SET ${fields.map(field => `${field} = ?`).join(`,\n`)} WHERE id = ?;`, [ ...Object.values(data), id ])
		.then(res => `updated ${res.affectedRows} central`);
};

export const insertCentral = data => {
	const fields = Object.keys(data);
	if (fields.length === 0)
		return Promise.resolve(null);
	return query(`INSERT INTO raus.Tbl_Centrals(${fields.join(", ")})VALUES(${fields.map(() => "?").join(", ")});`, Object.values(data))
		.then(res => `added ${res.affectedRows} central`);
};
