import { writeFile } from "fs/promises";

import { FTP_DIR_OUTBOX, SAMPLES_PERIOD_OFFSET_PERC, SAMPLES_BREACH_OFFSET_MINS } from "../config.js";
import { dtFloor } from "../utils.js";
import { processSamples } from "../model/samples.js";

const writeCSV = (fname, lines, count) => {
	if (lines.length < count)
		return Promise.resolve({ success: false, message: `${fname} not writen: only ${lines.length} lines` });
	return writeFile(`${FTP_DIR_OUTBOX}${fname}`, `Tiempo,Frecuencia[Hz],Potencia[MW],Potencia de Referencia[MW] (SetPoint)\n${lines.slice(0, count).join("\n") ?? ""}`)
		.then(() => ({ success: true, message: `${fname} writen` }));
};

export default ({ days, hours, minutes, seconds, milliseconds } = {}, ts_start = new Date()) => {
	const freq = Math.round(1000 * (60 * (60 * (24 * (days ?? 0) + (hours ?? 0)) + (minutes ?? 0)) + (seconds ?? 0)) + (milliseconds ?? 0));
	if (isNaN(freq) || freq <= 0)
		return Promise.resolve({ success: false, message: "No period given", ts_start });
	const mins = Math.round(freq / 1000 / 60);
	if (mins === 0)
		return Promise.resolve({ success: false, message: "period can not be less than 30 sec", ts_start });
	const count = 60 * mins;
	const t_to = dtFloor(mins, new Date(new Date() - freq * SAMPLES_PERIOD_OFFSET_PERC));
	const t_from = new Date(t_to - mins * 60 * 1000);
	t_to.setSeconds(t_to.getSeconds() + SAMPLES_BREACH_OFFSET_MINS * 60);
	return processSamples(t_from, t_to)
		.then(res => Object
			.entries(res)
			.map(([ fname, lines ]) => writeCSV(fname, lines, count))
		)
/*		.then(proms => proms
			.reduce((acc, prom) => acc
				.then(({ failed: failedOld, res: resOld }) => prom()
					.then(res => ({ failed: failedOld, res: [ ...resOld, res ] }))
					.catch(res => ({ failed: true, res: [ ...resOld, res ] }))
				), Promise.resolve({ failed: false, res: [] })
			)
			.then(({ failed, res }) => failed ? Promise.reject(res) : Promise.resolve(res))
		)*/
		.then(proms => Promise.all(proms))
		.then(res => ({
			success: res.every(({ success }) => success),
			message: res.length === 0 ? "No data" : res.map(({ message }) => message).join(";"),
			ts_start
		}))
		.catch(res => ({ success: false, message: res, ts_start }));
};

