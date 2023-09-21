const router = require("express").Router();

const {
  getSystemInfo,
  getSysIP,
  getApachePort,
  setApachePort,
  setSysHost,
  setSysIP,
  setSysNTP,
  setSysFTP,
  setSysTimeZone,
  setSysDescription,
  setSysRefPower,
  //	setSysNetworkIP,
  //	setSysNetworkSubnet,
  //	setSysNetworkDNS,
  //	setSysNetworkDHCP
} = require("./system.service");
const errorHandler = require("../helpers/error-handler");

router.get("/ip", (req, res, next) => {
  getSysIP()
    .then((info) => res.json(info))
    .catch(next);
});
router.get("/", (req, res, next) => {
  getSystemInfo()
    .then((info) => res.json(info))
    .catch(next);
});
router.put("/description", (req, res, next) => {
  const { description } = req.body;
  setSysDescription(description)
    .then((info) => res.json(info))
    .catch(next);
});
router.put("/ntp", (req, res, next) => {
  const { ntp } = req.body;
  setSysNTP(ntp)
    .then((info) => res.json(info))
    .catch(next);
});
router.put("/ftp", (req, res, next) => {
  const { host, username, password, remdir, port } = req.body;
  setSysFTP(host, username, password, remdir, port)
    .then((info) => res.json(info))
    .catch(next);
});
router.put("/ref_power", (req, res, next) => {
  const { ref_power } = req.body;
  setSysRefPower(ref_power.toString())
    .then((info) => res.json(info))
    .catch(next);
});
router.put("/web", (req, res, next) => {
  setApachePort(req.body)
    .then((info) => res.json(info))
    .catch(next);
});
router.put("/ip/:ifc", (req, res, next) => {
  setSysIP(req.params.ifc, req.body)
    .then((info) => res.json(info))
    .catch(next);
});
router.put("/hostname", (req, res, next) => {
  const { hostname } = req.body;
  setSysHost(hostname)
    .then((info) => res.json(info))
    .catch(next);
});
router.put("/timezone", (req, res, next) => {
  const { timezone } = req.body;
  setSysTimeZone(timezone)
    .then((info) => res.json(info))
    .catch(next);
});
/*router.put("/", (req, res, next) => {
	const { description, ntp, apacheData, hostname, timezone } = req.body;
	const pr = [];
	const keys = [];
	if (!!description) {
		pr.push(setSysDescription(description));
		keys.push("description");
	}
	if (!!ntp) {
		pr.push(setSysNTP(ntp));
		keys.push("ntp");
	}
	if (!!apacheData) {
		pr.push(setApacheData(apacheData));
		keys.push("apacheData");
	}
	if (!!hostname) {
		pr.push(setSysHost(hostname));
		keys.push("hostname");
	}
	if (!!timezone) {
		pr.push(setSysTimeZone(timezone));
		keys.push("timezone");
	}
	Promise.all(pr)
		.then(res => keys.reduce((acc, key, ind) => ({ ...acc, [key]: res[ind] }), {}))
		.then(info => res.json(info))
		.catch(next);
});*/
router.use(errorHandler);

module.exports = router;
