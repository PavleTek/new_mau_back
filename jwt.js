import { expressjwt } from "express-jwt";

import { JWT_SECRET } from "./config.js";

export default () => expressjwt({ JWT_SECRET, algorithms: ["HS256"] })
	.unless({
		path: ["/users/authenticate" , "/users/profile"] // public routes that don't require authentication
	});

