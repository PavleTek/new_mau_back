import mariadb from "mariadb";

import { DB_AUTH } from "./config.js";

export const query = (sql, params = []) => mariadb
	.createConnection(DB_AUTH)
	.then(conn => conn
		.query(sql, params)
		.catch(e => conn
			.end()
			.then(() => Promise.reject(e))
		)
		.then(res => conn
			.end()
			.then(() => Promise.resolve(res))
		)
	);
