import { readdir, rename } from "fs/promises";
import Client from "ssh2-sftp-client";

import { FTP_DIR_OUTBOX, FTP_DIR_SENT, FTP_FILE_NAME_TEMPLATE } from "../config.js";
import { getFTPInfo } from "../model/samples.js";

const ftpUpload = (fnames, fpath) => {
	const sftp = new Client("example-client");
	return getFTPInfo()
		.then(({ ftp_host, ftp_username, ftp_password, ftp_remdir, ftp_port }) => sftp
			.connect({
				host: ftp_host,
				port: ftp_port,
				username: ftp_username,
				password: ftp_password
			})
//			.then(ftp_remdir => sftp.cwd(ftp_remdir))
			.then(() => fnames
				.reduce(
					(acc, fname) => acc
						.then(oldRes => sftp
							.put(`${fpath}${fname}`, `${ftp_remdir}/${fname}`)
							.then(newRes => rename(`${FTP_DIR_OUTBOX}${fname}`, `${FTP_DIR_SENT}${fname}`)
								.then(() => ([ ...oldRes, newRes ]))
							)
							.catch(newRes => ([ ...oldRes, newRes ]))
						),
					Promise.resolve([])
				)
			)
		)
		.then(messages => {
			sftp.end();
			return { success: true, fnames, message: messages.join("\n") };
		})
		.catch(e => {
			if (!!sftp)
				sftp.end();
			return Promise.reject({ success: false, fnames, message: e.message });
		});
};

export default ({ days, hours, minutes, seconds, milliseconds } = {}, ts_start = new Date()) => readdir(FTP_DIR_OUTBOX, { withFileTypes: true })
	.then(list => list
		.filter(f => f.isFile())
		.map(({ name }) => name)
		.filter(name => FTP_FILE_NAME_TEMPLATE.test(name))
	)
	.then(list => ftpUpload(list, FTP_DIR_OUTBOX))
	.then(res => ({ success: true, message: res, ts_start }))
	.catch(res => ({ success: false, message: res, ts_start }));
