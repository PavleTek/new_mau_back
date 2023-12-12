import { cmd } from "../utils.js";

const PYTHON_EXECUTABLE = "/usr/bin/python";

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
		.then(res => ({ success: true, message: res, ts_start }))
		.catch(res => ({ success: false, message: res, ts_start }));
};

