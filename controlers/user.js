import express from "express";

const router = express.Router();

import errorHandler from "../error-handler.js";
import { getUser, setUserPassword, registerUser, updateUser, deleteUser, getUserById, getUserFromToken } from "../model/user.js";

router.post("/authenticate", (req, res, next) => {
	const { username, password } = req.body;
	getUser(username, password)
		.then(token => {
			res.status(200).json({ token });
		})
		.catch(e => {
		console.log(e);
	    res.status(e?.status ?? 500).json(e?.message ?? e);
  	});
});

router.post("/password", (req, res, next) => {
  const { userId, oldPassword, newPassword } = req.body;
	setUserPassword(userId, oldPassword, newPassword)
		.then(affectedRows => {
			res.status(200).json(`updated ${affectedRows} users`);
		})
		.catch(e => {
	    res.status(e?.status ?? 500).json(e?.message ?? e);
  	});
});

router.post("/register", (req, res, next) => {
  const { name, is_admin, mandatory, username, password } = req.body;
	registerUser(name, is_admin, mandatory, username, password)
		.then(affectedRows => {
			res.status(200).json(`created ${affectedRows} users`);
		})
		.catch(e => {
	    res.status(500).json(e);
  	});
});

router.get("/profile", (req, res) => {
	getUserFromToken(req, res)
	const userData = req.user;
	res.json(userData);
  });

router.put("/:id", (req, res, next) => {
	const id = parseInt(req.params.id);
	updateUser(id, req.body)
		.then(affectedRows => {
			res.status(200).json(`updated ${affectedRows} users`);
		})
		.catch(e => {
	    res.status(500).json(e);
  	});
});

router.delete("/:id", (req, res, next) => {
	const id = parseInt(req.params.id);
	deleteUser(id)
		.then(affectedRows => {
			res.status(200).json(`deleted ${affectedRows} users`);
		})
		.catch(e => {
	    res.status(500).json(e);
  	});
});

router.get("/:id?", (req, res, next) => {
	getUserById(parseInt(req.params.id))
		.then(rows => {
			res.status(200).json(rows);
		})
		.catch(e => {
	    res.status(500).json(e);
  	});
});


router.use(errorHandler);

export default router;
