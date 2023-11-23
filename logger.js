import { writeFileSync } from "fs";

import { LOG_DIR } from "./config.js";

const log_write = (text, level) => {
	const now = new Date().toISOString();
	writeFileSync(`${LOG_DIR}${now.replace(/T.+$/, "")}`, `[${now}] (${level}) ${text}\n`, { flag: "a" });
};

export const log = {
	info: text => { log_write(text, "INFO"); },
	warning: text => { log_write(text, "WARNING"); },
	error: text => { log_write(text, "ERROR"); }
};

