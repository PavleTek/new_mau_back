import { samplesCleanup } from "../model/samples.js";

export default ({ days, hours, minutes, seconds, milliseconds } = {}, ts_start = new Date()) => {
	const freq = Math.round(1000 * (60 * (60 * (24 * (days ?? 0) + (hours ?? 0)) + (minutes ?? 0)) + (seconds ?? 0)) + (milliseconds ?? 0));
	if (isNaN(freq) || freq <= 0)
		return Promise.resolve({ success: false, message: "No period given" });
	return samplesCleanup(freq / 1000)
		.then(({ raw, processed }) => ({ success: true, message: `Rows deleted: raw ${raw} processed ${processed}`, ts_start }))
		.catch(e => ({ success: false, message: e.message, ts_start }));
};

