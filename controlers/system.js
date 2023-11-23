import express from "express";

const router = express.Router();

import errorHandler from "../error-handler.js";
import { getFTPInfo, setFTPInfo } from "../model/samples.js";

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

router.use(errorHandler);

export default router;
