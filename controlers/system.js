import express from "express";

const router = express.Router();

import errorHandler from "../error-handler.js";
import { getFTPInfo, setFTPInfo, getSMTPInfo, setSMTPInfo } from "../model/system.js";

router.get("/ftp", (req, res, next) => {
	getFTPInfo()
		.then(result => res.json(result))
		.catch(next);
});

router.put("/ftp", (req, res, next) => {
	setFTPInfo(req.body)
		.then(result => res.json(result))
		.catch(next);
});

router.get("/smtp", (req, res, next) => {
	getSMTPInfo()
		.then(result => res.json(result))
		.catch(next);
});

router.put("/smtp", (req, res, next) => {
	setSMTPInfo(req.body)
		.then(result => res.json(result))
		.catch(next);
});

router.use(errorHandler);

export default router;
