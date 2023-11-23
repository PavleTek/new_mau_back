import { readdir } from "fs/promises";
import Client from "ssh2-sftp-client";

import { FTP_DIR_OUTBOX, FTP_DIR_SENT, FTP_FILE_NAME_TEMPLATE } from "../config.js";
import { getFTPInfo } from "../model/samples.js";
import { PromiseAllInOrderDeferredPessimistic } from "../utils.js";

const ftpUpload = (fname, fpath) => {
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
			.then(() => sftp
				.put(`${fpath}${fname}`, `${ftp_remdir}/${fname}`)
			)
		)
		.then(message => {
			sftp.end();
			return { success: true, fname, message };
		})
		.catch(e => {
			if (!!sftp)
				sftp.end();
			return Promise.reject({ success: false, fname, message: e.message });
		});
};

export default ({ days, hours, minutes, seconds, milliseconds } = {}, ts_start = new Date()) => readdir(FTP_DIR_OUTBOX, { withFileTypes: true })
	.then(list => list
		.filter(f => f.isFile())
		.map(({ name }) => name)
		.filter(name => FTP_FILE_NAME_TEMPLATE.test(name))
	)
	.then(list => list
		.map(fname => () => ftpUpload(fname, FTP_DIR_OUTBOX)
			.then(res => res.success ? rename(`${FTP_DIR_OUTBOX}${fname}`, `${FTP_DIR_SENT}${fname}`).then(() => res) : Promise.resolve(res))
		)
	)
	.then(proms => PromiseAllInOrderDeferredPessimistic(proms)
		.then(res => ({ success: true, message: JSON.stringify(res), ts_start }))
		.catch(res => ({ success: false, message: JSON.stringify(res), ts_start }))
	);

