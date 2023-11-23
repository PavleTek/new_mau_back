import { readdir } from "fs/promises";

import { SAMPLES_DIR_HIRES, SAMPLES_HIRES_FILE_NAME_TEMPLATE } from "../config.js";
import { archiveAndDelete } from "../utils.js";

export default ({ days, hours, minutes, seconds, milliseconds } = {}, ts_start = new Date()) => readdir(SAMPLES_DIR_HIRES, { withFileTypes: true })
	.then(list => list
		.filter(f => f.isFile())
		.map(({ name }) => name)
		.filter(name => SAMPLES_HIRES_FILE_NAME_TEMPLATE.test(name))
	)
	.then(list => list
		.map(fname => archiveAndDelete(SAMPLES_DIR_HIRES, fname))
	)
	.then(proms => Promise.all(proms)
		.then(res => ({ success: true, message: `Files archived and deleted: ${res.join(";")}`, ts_start }))
		.catch(e => ({ success: false, message: e.message, ts_start }))
	);
