import express from "express";
const router = express.Router();

import errorHandler from "../error-handler.js";
import { getRAUType, deleteRAUType, updateRAUType, insertRAUType } from "../model/rau.js";

router.get("/:id?", (req, res, next) => {
	getRAUType(parseInt(req.params.id))
		.then(user => res.json(user))
		.catch(next);
});

router.post("/", (req, res, next) => {
	insertRAUType(req.body)
		.then(user => res.json(user))
		.catch(next);
});

router.put("/:id", (req, res, next) => {
	updateRAUType(parseInt(req.params.id), req.body)
		.then(user => res.json(user))
		.catch(next);
});

router.delete("/:id", (req, res, next) => {
	deleteRAUType(parseInt(req.params.id))
		.then(user => res.json(user))
		.catch(next);
});

router.use(errorHandler);

export default router;
