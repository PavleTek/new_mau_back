import { exec } from "child_process";
import { createWriteStream, accessSync, unlinkSync } from "fs";
import archiver from "archiver";
import { expressjwt } from "express-jwt";

import { EXEC_DIR, JWT_SECRET } from "./config.js";

export const PromiseAllInOrderDeferred = proms => proms
	.reduce((acc, prom) => acc
		.then(oldRs => prom()
			.then(newR => ([ ...oldRs, newR ]))
		), Promise.resolve([])
	);

export const PromiseAllInOrderDeferredPessimistic = proms => {
	let rejected = false;
	return proms
		.reduce((acc, prom) => rejected ? acc : acc
			.then(oldRs => prom()
				.then(newR => ([ ...oldRs, newR ]))
				.catch(val => {
					rejected = true;
					return Promise.reject([ ...oldRs, val ]);
				})
			), Promise.resolve([])
		);
};

export const archiveAndDelete = (fPath, fName) => new Promise((res, rej) => {
	try {
		accessSync(fPath);
	} catch(e) {
		rej(e);
		return;
	}
	let settled = false;
	const filePath = `${fPath}${fName}`;
	const zipFileName = `${fName}.zip`;
	const output = createWriteStream(`${filePath}.zip`);
	const archive = archiver("zip", { zlib: { level: 9 } });
	const handleError = e => {
		output.end();
		if (!settled) {
			settled = true;
			rej(e);
		}
	};
	const handleOK = () => {
		if (!settled) {
			settled = true;
			res(filePath);
		}
	};
	output.on("error", handleError);
	output.on("close", handleOK);
	output.on("finish", handleOK);
	archive.on("warning",handleError);
	archive.on("error", handleError);
	archive.on("close",handleOK );
	archive.on("end", handleOK);
	archive.pipe(output);
	archive.file(filePath, { name: fName });
	archive.finalize();
}).then(filePath => {
	unlinkSync(filePath);
	return filePath;
});

export const cmd = (text, stdin_text = "") => {
	const controller = new AbortController();
	const { signal } = controller;
	let status = "idle", promise;
	if (status !== "running") {
		status = "running";
		promise = new Promise((resolve, reject) => {
			const child = exec(text, { signal, cwd: EXEC_DIR }, (error, stdout, stderr) => {
				if (error) {
					const { message, code, cmd } = error;
					status = code;
					reject({ message, code, cmd });
					return;
				}
				if (stderr) {
					status = "error";
					reject(stderr);
					return;
				}
				status = "success";
				resolve(stdout.trim());
			});
			if (stdin_text) {
				child.stdin.write(stdin_text);
				child.stdin.end();
			}
			return child;
		});
	}
	promise.cancel = () => {
		if (status === "running")
			controller.abort();
	};
	promise.status = () => status;
	return promise;
};

export const jwt = () => expressjwt({ secret: JWT_SECRET, algorithms: ["HS256"] })
	.unless({
		path: ["/users/authenticate"] // public routes that don't require authentication
	});

export const pause = s => x => new Promise((res, rej) => {
	setTimeout(() => {
		res(x);
	}, 1000 * s);
});

export const dtFloor = (mins, d) => {
	const d1 = new Date(d.getTime());
	d1.setSeconds(0);
	d1.setMilliseconds(0);
	d1.setMinutes(d.getMinutes() - d.getMinutes() % mins);
	return d1;
};
