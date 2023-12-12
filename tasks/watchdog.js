import { cmd } from "../utils.js";
import { getLastSamplesPercentage } from "../model/samples.js";

export default ({ days, hours, minutes, seconds, milliseconds } = {}, ts_start = new Date()) => {
	const freq = Math.round(1000 * (60 * (60 * (24 * (days ?? 0) + (hours ?? 0)) + (minutes ?? 0)) + (seconds ?? 0)) + (milliseconds ?? 0));
	if (isNaN(freq) || freq <= 0)
		return Promise.resolve({ success: false, message: "No period given", ts_start });
	const mins = Math.round(freq / 1000 / 60);
	return getLastSamplesPercentage(mins)
		.then(res => {
			const text = res.map(({ rau_id, percentage }) => `RAU${rau_id}:${100. * percentage}%`).join(",");
			if (res.filter(({ percentage }) => percentage <= 0.9).length > 0)
				return cmd("systemctl restart krafttex_worker_3000")
					.then(() => Promise.reject(`Too few samples: ${text}. Service restarted.`));
			return `OK: ${text}`;
		})
		.then(res => ({ success: true, message: res, ts_start }))
		.catch(res => ({ success: false, message: res, ts_start }));
};

