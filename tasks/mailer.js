import { cmd } from "../utils.js";
import { getLastSamplesPercentage } from "../model/samples.js";
import { getLastJobsCount } from "../model/task.js";
import { getDiskUsage, sendMail } from "../model/system.js";

const check1 = mins => getLastSamplesPercentage(mins)
	.then(res => {
		const text = res.map(({ rau_id, percentage }) => `RAU${rau_id}:${100. * percentage}%`).join(",");
		if (res.filter(({ percentage }) => percentage <= 0.9).length > 0)
			return { success: false, message: `Too few samples: ${text}.` };
		return { success: true, message: `OK: ${text}` };
	});

const check2 = mins => getLastJobsCount(mins)
	.then(res => {
		if (res.length > 0)
			return { success: false, message: `Too few samples: ${res.map(({ name, cnt }) => `${name}:${cnt}`).join(",")}.` };
		return { success: true, message: "OK" };
	});

const check3 = () => getDiskUsage()
	.then(({ free, total, percentage }) => {
		const onegb = 1073741824;
		const text = `${(1. * free / onegb).toFixed(2)} of ${(1. * total / onegb).toFixed(2)} GB free (${(100 * percentage).toFixed(2)}%)`;
		if (percentage < 0.1)
			return { success: false, message: `Disk space low: ${text}` };
		return { success: true, message: `OK: ${text}` };
	});

export default ({ days, hours, minutes, seconds, milliseconds } = {}, ts_start = new Date()) => {
	const freq = Math.round(1000 * (60 * (60 * (24 * (days ?? 0) + (hours ?? 0)) + (minutes ?? 0)) + (seconds ?? 0)) + (milliseconds ?? 0));
	if (isNaN(freq) || freq <= 0)
		return Promise.resolve({ success: false, message: "No period given", ts_start });
	const mins = Math.round(freq / 1000 / 60);
	return Promise.all([ check1(mins), check2(mins), check3() ])
		.then(res => {
			console.log(res);
			const success = res.every(({ success }) => success);
			const message = res.map(({ message }) => message).join(";");
			if (success)
				return { success, message };
			else
				return sendMail("KRAFTTEX alert", `There are following problems with the system: ${message}`)
					.then(() => ({ success, message: `${message}; Mail sent.` }))
					.catch(e => ({ success: false, message: e.message }));
		})
		.then(({ success, message }) => ({ success, message, ts_start }))
		.catch(res => ({ success: false, message: res, ts_start }));
};

