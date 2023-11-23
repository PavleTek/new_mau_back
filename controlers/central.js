import express from "express";
const router = express.Router();

import errorHandler from "../error-handler.js";
import { getCentral, deleteCentral, updateCentral, insertCentral } from "../model/central.js";

router.get("/:id?", (req, res, next) => {
	getCentral(parseInt(req.params.id))
		.then(central => res.json(central))
		.catch(next);
});

router.post("/", (req, res, next) => {
	insertCentral(req.body)
		.then(central => res.json(central))
		.catch(next);
});

router.put("/:id", (req, res, next) => {
	updateCentral(parseInt(req.params.id), req.body)
		.then(central => res.json(central))
		.catch(next);
});

router.delete("/:id", (req, res, next) => {
	deleteCentral(parseInt(req.params.id))
		.then(central => res.json(central))
		.catch(next);
});

router.use(errorHandler);

export default router;
