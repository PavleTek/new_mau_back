import express from "express";
const router = express.Router();

import errorHandler from "../error-handler.js";
import { getTasks, deleteTasks, updateTasks, insertTasks, getJobs, getJobsByID } from "../model/task.js";

router.get("/:id?", (req, res, next) => {
	getTasks(parseInt(req.params.id))
		.then(user => res.json(user))
		.catch(next);
});

router.post("/", (req, res, next) => {
	insertTasks(req.body)
		.then(user => res.json(user))
		.catch(next);
});

router.put("/:id", (req, res, next) => {
	updateTasks(parseInt(req.params.id), req.body)
		.then(user => res.json(user))
		.catch(next);
});

router.delete("/:id", (req, res, next) => {
	deleteTasks(parseInt(req.params.id))
		.then(user => res.json(user))
		.catch(next);
});

router.put("/enable/:id", (req, res, next) => {
	updateTasks(parseInt(req.params.id), { enabled: true })
		.then(user => res.json(user))
		.catch(next);
});

router.put("/disable/:id", (req, res, next) => {
	updateTasks(parseInt(req.params.id), { enabled: false })
		.then(user => res.json(user))
		.catch(next);
});

router.get("/jobs/:task_id/:page?", (req, res, next) => {
	const page = req.params.page && parseInt(req.params.page);
	console.log(page);
	getJobs(parseInt(req.params.task_id), page)
		.then(user => res.json(user))
		.catch(next);
});

router.get("/job/:id", (req, res, next) => {
	getJobsByID(parseInt(req.params.id))
		.then(user => res.json(user))
		.catch(next);
});

router.use(errorHandler);

export default router;
