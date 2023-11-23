import { accessSync } from "fs";

import { query } from "../db.js";
import { add, remove, start, stop } from "../scheduler.js";
import { log } from "../logger.js";
import { TASKS_DISPLAY_ROWS } from "../config.js";

export const getTasks = (id = null) => id
	? query("SELECT id, name, description, period, enabled FROM raus.tasks WHERE id = ?;", [ id ])
		.then(rows => rows?.[0])
		.then(({ enabled, ...rest }) => ({ enabled: !!enabled, ...rest }))
	: query("SELECT id, name, description, period, enabled FROM raus.tasks;")
		.then(res => res
			.map(({ enabled, ...rest }) => ({ enabled: !!enabled, ...rest }))
		);

export const deleteTasks = id => query("DELETE FROM raus.tasks WHERE id = ? RETURNING name;", [ id ])
	.then(rows => rows?.[0])
	.then(({ name }) => {
		remove(name);
		return `task "${name}" deleted`;
	});

export const updateTasks = (id, data) => {
	const fields = Object.keys(data);
	if (fields.length === 0)
		return Promise.resolve(0);
	return query(`UPDATE raus.tasks SET ${fields.map(field => `${field} = ?`).join(`,\n`)} WHERE id = ?;`, [ ...Object.values(data), id ])
		.then(() => getTasks(id))
		.then(({ id, name, description, period, enabled }) => {
			remove(name);
			return add(name, description, period, enabled, id);
		});
};

export const insertTasks = data => {
	const { name, description, period } = data;
	const fPath = `./tasks/${name}.js`;
	try {
		accessSync(fPath);
	} catch(e) {
		return Promise.resolve(0);
	}
	return query(`INSERT INTO raus.tasks(name, description, period)VALUES(?, ?, ?) RETURNING id, name, description, period, enabled;`, [ name, description, period ])
		.then(rows => rows?.[0])
		.then(({ id, name, description, period, enabled }) => add(name, description, period, enabled, id));
};

export const insertJob = (task_id, ts_start, success, message) => query("INSERT INTO raus.jobs(task_id, ts_start, success, message) VALUES(?, ?, ?, ?);", [ task_id, ts_start, success, message ])
	.then(res => res.affectedRows);

export const getJobs = (task_id, page = 1) => query("SELECT count(*) AS cnt FROM raus.jobs WHERE task_id = ?;", [ task_id ])
	.then(rows => rows[0])
	.then(row => row["cnt"])
	.then(cnt => query("SELECT id, task_id, ts_start, ts_end, success, message FROM raus.jobs WHERE task_id = ? ORDER BY ts_start DESC LIMIT ? OFFSET ?;", [ task_id, TASKS_DISPLAY_ROWS, TASKS_DISPLAY_ROWS * (page - 1) ])
		.then(result => ({
			result,
			page,
			totalPages: Math.ceil(cnt / TASKS_DISPLAY_ROWS)
		}))
	);

export const getJobsByID = (id = null) => id
	? query("SELECT id, task_id, ts_start, ts_end, success, message FROM raus.jobs WHERE id = ?;", [ id ])
		.then(rows => rows?.[0])
	: query("SELECT id, task_id, ts_start, ts_end, success, message FROM raus.jobs;");

export const initTasks = () => getTasks()
	.then(tasks => tasks
		.forEach(({ id, name, description, period, enabled }) => {
			add(name, description, period, enabled, id);
		})
	);