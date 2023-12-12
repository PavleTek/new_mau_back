import * as fs from "fs";
import os from "os";
import disk from "diskusage";
import nodemailer from "nodemailer";

import { APP_DIR } from "../config.js";
import { query } from "../db.js";

export const getFTPInfo = () => query("SELECT id, `key`, value FROM raus.`system` WHERE `key` LIKE 'ftp_%';")
	.then((res) =>
    res.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
  )
	.then(({ ftp_port, ...rest }) => ({
		ftp_port: parseInt(ftp_port),
		...rest
	}));

export const setFTPInfo = info => Promise.all(
		Object
			.entries(info)
			.map(([ key, value ]) => query("UPDATE raus.`system` SET `value` = ? WHERE `key` = ?;", [ value, key ]))
	)
	.then(() => "OK");

export const getSMTPInfo = () => query("SELECT id, `key`, value FROM raus.`system` WHERE `key` LIKE 'smtp_%';")
	.then(res =>
    res.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
  )
	.then(({ smtp_auth, smtp_tls, smtp_port, ...rest }) => ({
		smtp_auth: smtp_auth === 1,
		smtp_tls: smtp_tls === 1,
		smtp_port: parseInt(smtp_port),
		...rest
	}));

export const setSMTPInfo = info => Promise.all(
		Object
			.entries(info)
			.map(([ key, value ]) => query("UPDATE raus.`system` SET `value` = ? WHERE `key` = ?;", [ value, key ]))
	)
	.then(() => "OK");

export const getDiskUsage = message => disk
	.check(APP_DIR)
	.then(({ free, total }) => ({ free, total, percentage: 1. * free / total }));

export const sendMail = (subject, message) => getSMTPInfo()
	.then(({ smtp_host, smtp_auth, smtp_username, smtp_password, smtp_tls, smtp_port, smtp_receiver }) => {
		const transporter = nodemailer.createTransport({
			host: smtp_host,
			port: smtp_port,
			secure: smtp_auth,
			auth: {
				user: smtp_username,
				pass: smtp_password
			}
		});
		const settings = {
			from: smtp_username,
			to: smtp_receiver,
			subject,
			text: message
		};
		return transporter
			.sendMail(settings)
			.then(({ messageId }) => `Message sent: ${messageId}`)
			.then(res => {
				transporter.close();
				return res;
			})
			;
	});

