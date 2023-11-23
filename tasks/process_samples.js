import { writeFile } from "fs/promises";

import { FTP_DIR_OUTBOX, SAMPLES_PERIOD_OFFSET_PERC, SAMPLES_BREACH_OFFSET_MINS } from "../config.js";
import { processSamples } from "../model/samples.js";

const dtFloor = (mins, d) => {
	const d1 = new Date(d.getTime());
	d1.setSeconds(0);
	d1.setMilliseconds(0);
	d1.setMinutes(d.getMinutes() - d.getMinutes() % mins);
	return d1;
};

const writeCSV = (fname, lines, count) => {
	if (lines.length < count)
		return Promise.reject(`${fname} not writen: only ${lines.length} lines`);
	return writeFile(`${FTP_DIR_OUTBOX}${fname}`, `Tiempo,Frecuencia[Hz],Potencia[MW],Potencia de Referencia[MW] (SetPoint)\n${lines.slice(0, count).join("\n") ?? ""}`)
		.then(() => `${fname} writen`);
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
		.then(res => res
			.reduce((acc, { fname, moment, frequency, power, ref_power }) => ({
				...acc,
				[fname]: [ ...(acc[fname] ?? []), `${moment},${frequency.toFixed(5)},${power.toFixed(4)},${ref_power.toFixed(4)}` ] }
			), {})
		)
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
		.then(res => ({ success: true, message: JSON.stringify(res), ts_start }))
		.catch(res => ({ success: false, message: JSON.stringify(res), ts_start }));
};

