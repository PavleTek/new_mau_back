import { accessSync } from "fs";

import { query } from "../db.js";
import { add, remove, start, stop } from "../scheduler.js";
import { log } from "../logger.js";
import { TASKS_DISPLAY_ROWS } from "../config.js";

export const getLastJobsCount = mins => query(`
SELECT t.name, count(*) AS cnt
  FROM raus.jobs j
       INNER JOIN raus.tasks t ON j.task_id = t.id
 WHERE j.ts_start >= now() - INTERVAL ? MINUTE
   AND NOT j.success
 GROUP BY t.id, t.name;`, [ mins ]);

export const getTasks = (id = null) => id
	? query(`SELECT t.id, t.name, t.description, t.period, t.enabled, count(j.id) AS cntfailed
	FROM raus.tasks t
	LEFT OUTER JOIN raus.jobs j ON t.id = j.task_id AND j.ts_start >= now() - INTERVAL 10 MINUTE AND NOT success
	WHERE t.id = ?
	GROUP BY t.id, t.name, t.description, t.period, t.enabled;`, [ id ])
		.then(rows => rows?.[0])
		.then(({ enabled, ...rest }) => ({ enabled: !!enabled, ...rest }))
	: query(`SELECT t.id, t.name, t.description, t.period, t.enabled, count(j.id) AS cntfailed
	FROM raus.tasks t
	LEFT OUTER JOIN raus.jobs j ON t.id = j.task_id AND j.ts_start >= now() - INTERVAL 10 MINUTE AND NOT success
	GROUP BY t.id, t.name, t.description, t.period, t.enabled;`)
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
	if (data.period !== undefined) {
		if (data.period.days === 0)
			delete data.period.days;
		if (data.period.hours === 0)
			delete data.period.hours;
		if (data.period.minutes === 0)
			delete data.period.minutes;
		if (data.period.seconds === 0)
			delete data.period.seconds;
	}
	return query(`UPDATE raus.tasks SET ${fields.map(field => `${field} = ?`).join(`,\n`)} WHERE id = ?;`, [ ...Object.values(data), id ])
		.then(() => getTasks(id))
		.then(({ id, name, description, period, enabled }) => {
			remove(name);
			return add(name, description, period, enabled, id);
		});
};

export const insertTasks = data => {
	const { name, description, period } = data;
	if (period.days === 0)
		delete period.days;
	if (period.hours === 0)
		delete period.hours;
	if (period.minutes === 0)
		delete period.minutes;
	if (period.seconds === 0)
		delete period.seconds;
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
