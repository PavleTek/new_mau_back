import express from "express";
const router = express.Router();

import errorHandler from "../error-handler.js";
import { getRAU, getRAUByGen, updateRAU, insertRAU, deleteRAU, toggleRAU } from "../model/rau.js";

router.put("/enable/:id", (req, res, next) => {
	toggleRAU(parseInt(req.params.id), 1)
		.then(() => res.json("OK"))
		.catch(next);
});

router.put("/disable/:id", (req, res, next) => {
	toggleRAU(parseInt(req.params.id), 0)
		.then(() => res.json("OK"))
		.catch(next);
});

router.get("/:id?", (req, res, next) => {
	getRAU(parseInt(req.params.id))
		.then(user => res.json(user))
		.catch(next);
});

router.post("/", (req, res, next) => {
	insertRAU(req.body)
		.then(user => res.json(user))
		.catch(next);
});

router.put("/:id", (req, res, next) => {
	updateRAU(parseInt(req.params.id), req.body)
		.then(user => res.json(user))
		.catch(next);
});

router.delete("/:id", (req, res, next) => {
	deleteRAU(parseInt(req.params.id))
		.then(user => res.json(user))
		.catch(next);
});

router.get("/by-gen/:gen_id", (req, res, next) => {
	getRAUByGen(parseInt(req.params.gen_id))
		.then(user => res.json(user))
		.catch(next);
});

router.use(errorHandler);

export default router;
