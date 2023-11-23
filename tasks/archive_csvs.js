import { readdir } from "fs/promises";

import { FTP_DIR_SENT, FTP_FILE_NAME_TEMPLATE } from "../config.js";
import { archiveAndDelete } from "../utils.js";

export default ({ days, hours, minutes, seconds, milliseconds } = {}, ts_start = new Date()) => readdir(FTP_DIR_SENT, { withFileTypes: true })
	.then(list => list
		.filter(f => f.isFile())
		.map(({ name }) => name)
		.filter(name => FTP_FILE_NAME_TEMPLATE.test(name))
	)
	.then(list => list
		.map(fname => archiveAndDelete(FTP_DIR_SENT, fname))
	)
	.then(proms => Promise.all(proms)
		.then(res => ({ success: true, message: `Files archived and deleted: ${res.join(";")}`, ts_start }))
		.catch(e => ({ success: false, message: e.message, ts_start }))
	);
