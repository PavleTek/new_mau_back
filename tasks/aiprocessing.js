import { cmd } from "../utils.js";

import { TASKS_PYTHON_EXECUTABLE } from "../config.js";

export default ({ days, hours, minutes, seconds, milliseconds } = {}, ts_start = new Date()) => {
	return Promise.resolve("OK")
		.then(res => ({ success: true, message: res, ts_start }))
		.catch(res => ({ success: false, message: res, ts_start }));
};
