const { exec } = require("child_process");

const cmd = text => {
	const controller = new AbortController();
	const { signal } = controller;
	let status = "idle", promise;
	if (status !== "running") {
		status = "running";
    promise = new Promise((resolve, reject) => {
			exec(text, { signal, cwd: "/opt/api/run/" }, (error, stdout, stderr) => {
				if (error) {
					const { message, code, cmd } = error;
					status = code;
					reject({ message, code, cmd });
					return;
				}
				if (stderr) {
					status = "error";
					reject(stderr);
					return;
				}
				status = "success";
				resolve(stdout);
			});
    });
	}
	promise.cancel = () => {
		if (status === "running")
			controller.abort();
	};
	promise.status = () => status;
	return promise;
}

/*

const cmd = text => new Promise((resolve, reject) => {
	exec(text, (error, stdout, stderr) => {
		if (error)
			reject(error.message);
		if (stderr)
			reject(stderr);
		resolve(stdout);
	});
});
*/

//const PromiseAllInOrder = proms => proms.reduce((acc, prom) => acc.then(oldRs => prom.then(newR => ([ ...oldRs, newR ]))), Promise.resolve([]));
const PromiseAllInOrderDeferred = proms => proms.reduce((acc, prom) => acc.then(oldRs => prom().then(newR => ([ ...oldRs, newR ]))), Promise.resolve([]));
/*const PromiseAllInOrderDeferred = proms => proms.reduce((acc, prom) => acc.then(oldRs => prom().then(newR => {
	console.log(newR, (new Date()).toISOString());
	return [ ...oldRs, newR ];
})), new Promise(resolve => {
	console.log("*** start ***", (new Date()).toISOString());
	resolve([]);
}));*/

const PromiseAllInOrderDeferredPessimistic = proms => {
	let rejected = false;
	return proms
		.reduce((acc, prom) => rejected ? acc : acc
			.then(oldRs => prom()
				.then(newR => ([ ...oldRs, newR ]))
				.catch(val => {
					rejected = true;
					return Promise.reject(val);
				})
			), Promise.resolve([])
		);
};

module.exports = {
	cmd,
	PromiseAllInOrderDeferred,
	PromiseAllInOrderDeferredPessimistic
};

