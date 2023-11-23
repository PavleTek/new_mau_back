import express from "express";
const router = express.Router();

import errorHandler from "../error-handler.js";
import { getGenerator, deleteGenerator, updateGenerator, insertGenerator } from "../model/rau.js";

router.get("/:id?", (req, res, next) => {
	getGenerator(parseInt(req.params.id))
		.then(user => res.json(user))
		.catch(next);
});

router.post("/", (req, res, next) => {
	insertGenerator(req.body)
		.then(user => res.json(user))
		.catch(next);
});

router.put("/:id", (req, res, next) => {
	updateGenerator(parseInt(req.params.id), req.body)
		.then(user => res.json(user))
		.catch(next);
});

router.delete("/:id", (req, res, next) => {
	deleteGenerator(parseInt(req.params.id))
		.then(user => res.json(user))
		.catch(next);
});

router.use(errorHandler);

export default router;
