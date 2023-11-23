import { accessSync } from "fs";
import { ToadScheduler, LongIntervalJob, AsyncTask } from "toad-scheduler";

import { log } from "./logger.js";
import { insertJob } from "./model/task.js";

const scheduler = new ToadScheduler()

export const start = name => {
    scheduler.startById(name);
};

export const stop = name => {
    scheduler.stopById(name);
};

export const add = (name, description, period, enabled, task_id) => {
	const fPath = `./tasks/${name}.js`;
	try {
		accessSync(fPath);
		return import(fPath)
			.then(fn => {
				const { days, hours, minutes, seconds, milliseconds } = period;
				const freq = Math.round(1000 * (60 * (60 * (24 * (days ?? 0) + (hours ?? 0)) + (minutes ?? 0)) + (seconds ?? 0)) + (milliseconds ?? 0));
				if (isNaN(freq) || freq < 1000) {
					log.error(`task '${name}' not added: no period given`);
					return Promise.resolve(`task '${name}' not added: no period given`);
				}
				const task = new AsyncTask(
					name,
					() => fn.default(period)
						.then(({ success, message, ts_start }) => insertJob(task_id, ts_start, success, message))
						.catch(e => { log.error(e.message); }),
					e => { /* handle error here */ }
				);
				const job = new LongIntervalJob(period, task, { id: name, preventOverrun: true });
				job.description = description;
				scheduler.addLongIntervalJob(job);
				if (!enabled)
					scheduler.stopById(name);
				log.info(`task '${name}' added`);
				return 1;
			});
	} catch(e) {
		log.error(`task ${name} not added: ${fPath} does not exist`);
		return Promise.resolve(0);
	}
}

export const remove = name => {
	try {
		scheduler.removeById(name);
		log.info(`task '${name}' removed`);
	} catch (e) {
		log.error(`error on task '${name}' removal`);
	}
};

export const list = () => scheduler
    .getAllJobs()
    .map(({ id, description, schedule, task }) => ({
        name: id,
        description,
        period: schedule,
        isRunning: task.isExecuting
    }));

export const halt = () => {
    scheduler.stop();
};
