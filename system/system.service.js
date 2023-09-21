const prisma = require("../prisma.js");

const fs = require("fs");
const { readFile, writeFile } = require("fs/promises");
const os = require("os");
const dns = require("dns");
const { getNetworks, setNetworks } = require("../helpers/system.js");

const { cmd } = require("../helpers/utils.js");

const sec2Time = (t) => {
  const secs = (t % 60).toFixed(2);
  t = Math.round(t - secs) / 60;
  const mins = t % 60;
  t = (t - mins) / 60;
  const hours = t % 24;
  return `${(t - hours) / 24} days ${hours} hours ${mins} minutes ${secs} seconds`;
};
//dhclient -v -r

//const apacheConfFile = "/etc/httpd/conf/httpd.conf";
const apacheConfFile = "/etc/apache2/ports.conf";
const apacheVHFile = "/etc/apache2/sites-enabled/000-default.conf";
//const apacheConfTemplate = "/opt/api/api/ports.conf";

//const apacheRestartCommand = "systemctl restart httpd";
const apacheRestartCommand = "systemctl restart apache2";

//const apacheStatusCommand = "systemctl status httpd";
const apacheStatusCommand = "systemctl status apache2";

const aiScriptsDir = "/opt/api/run";

const getApachePort = () =>
  readFile(apacheConfFile, { encoding: "utf8" }).then(
    (file) =>
      file
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^Listen \d+$/.test(line))
        .map((line) => parseInt(line.match(/^Listen (\d+)$/)[1]))[0]
  );

const setApachePort = ({ port }) =>
  readFile(apacheConfFile, { encoding: "utf8" })
    .then((file) =>
      file
        .split("\n")
        .map((line) => line.trim())
        .map((line) => line.replace(/^Listen \d+$/, `Listen ${port}`))
        .join("\n")
    )
    .then((file) => writeFile(apacheConfFile, file))
    .then(() => readFile(apacheVHFile, { encoding: "utf8" }))
    .then((file) =>
      file
        .split("\n")
        .map((line) => line.trim())
        .map((line) => line.replace(/^<VirtualHost \*:\d+>$/, `<VirtualHost *:${port}>`))
        .join("\n")
    )
    .then((file) => writeFile(apacheVHFile, file))
    .then(() =>
      cmd(apacheRestartCommand)
        .then(
          () =>
            new Promise((resolve) => {
              setTimeout(resolve, 1000);
            })
        )
        .then(() => cmd(apacheStatusCommand))
        .then((stdout) => {
          if (/active \(running\)/.test(stdout)) return "Apache restarted";
          throw "Apache failed to start";
        })
    )
    .then(() => ({ port }));

const setSysHost = (name) => {
  if (name === os.hostname()) return Promise.resolve(name);
  return cmd(`hostnamectl set-hostname ${name}`).then(() => {
    if (name === os.hostname()) return name;
    throw `hostname not set: ${os.hostname()}`;
  });
};

const setSysIP = (ifc, data) =>
  getNetworks()
    .then((networks) => networks.map(({ name, ...rest }) => (name === ifc ? { name, ...data } : { name, ...rest })))
    .then((networks) => setNetworks(networks));

const getSysTZ = () =>
  cmd("timedatectl").then((stdout) => {
    const matchTZ = stdout.match(/Time zone: ([A-Za-z/_-]+) \(([^,]+), ([^)]+)\)/);
    if (matchTZ === null) throw "Can't resolve timezone";
    let matchNTPSync = stdout.match(/System clock synchronized: ([^\n\r\t ]+)/);
    if (matchNTPSync !== null) matchNTPSync = matchNTPSync[1] === "yes";
    //			throw "Can't resolve if NTP is synchronised";
    let matchNTPActive = stdout.match(/systemd-timesyncd.service active: ([^\n\r\t ]+)/);
    if (matchNTPActive !== null) matchNTPActive = matchNTPActive[1] === "yes";
    //			throw "Can't resolve if NTP is active";
    return {
      fullName: matchTZ[1],
      shortName: matchTZ[2],
      offset: matchTZ[3],
      NTPSync: matchNTPSync,
      NTPActive: matchNTPActive,
    };
  });

const setSysTimeZone = (tz) =>
  getSysTZ().then(({ fullName }) => {
    if (tz === fullName) return tz;
    return cmd(`timedatectl set-timezone ${tz}`).then(() => tz);
  });

const getSysIP = () => getNetworks();

const getSystemInfo = () => {
  //	const apacheData = getApacheData();
  const uptime = os.uptime();
  return Promise.all([
    prisma.system.findUnique({ where: { key: "description" } }).then((row) => row?.value),
    prisma.system.findUnique({ where: { key: "ntp_ip" } }).then((row) => row?.value),
    getSysTZ(),
    prisma.system.findUnique({ where: { key: "ftp_host" } }).then((row) => row?.value),
    prisma.system.findUnique({ where: { key: "ftp_username" } }).then((row) => row?.value),
    prisma.system.findUnique({ where: { key: "ftp_password" } }).then((row) => row?.value),
    prisma.system.findUnique({ where: { key: "ftp_remdir" } }).then((row) => row?.value),
    prisma.system.findUnique({ where: { key: "ftp_port" } }).then((row) => row?.value),
    prisma.system.findUnique({ where: { key: "ref_power" } }).then((row) => row?.value),
    getNetworks(),
    getApachePort(),
  ]).then(
    ([
      description = null,
      ntp = null,
      timezone = null,
      ftp_host = null,
      ftp_username = null,
      ftp_password = null,
      ftp_remdir = null,
      ftp_port = null,
      ref_power = null,
      networks = null,
      apachePort = null,
    ]) => ({
      hostname: os.hostname(),
      uptime: { timestamp: uptime, readable: sec2Time(uptime) },
      totalmem: os.totalmem(),
      cpus: os.cpus(),
      dns: dns.getServers(),
      networkInterfaces: networks,
      apachePort,
      timezone,
      description,
      ntp,
      ftp_host,
      ftp_username,
      ftp_password,
      ftp_remdir,
      ftp_port,
      ref_power,
      aiscripts: fs.readdirSync(aiScriptsDir),
    })
  );
};

const setSysData = (key) => (value) =>
  prisma.system
    .upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
    .then(({ id, key, value }) => ({ [key]: value }));

const setSysDescription = setSysData("description");
const setSysNTP = setSysData("ntp_ip");
const setSysFTP = (host, username, password, remdir, port) =>
  Promise.all([
    setSysData("ftp_host")(host),
    setSysData("ftp_username")(username),
    setSysData("ftp_password")(password),
    setSysData("ftp_remdir")(remdir),
    setSysData("ftp_port")(port.toString()),
  ]).then(([host, username, password, remdir, port]) => ({ host, username, password, remdir, port }));
const setSysRefPower = setSysData("ref_power");

const getSysFTP = () => {
  return Promise.all([
    prisma.system.findUnique({ where: { key: "ftp_host" } }).then((row) => row?.value),
    prisma.system.findUnique({ where: { key: "ftp_username" } }).then((row) => row?.value),
    prisma.system.findUnique({ where: { key: "ftp_password" } }).then((row) => row?.value),
    prisma.system.findUnique({ where: { key: "ftp_remdir" } }).then((row) => row?.value),
    prisma.system.findUnique({ where: { key: "ftp_port" } }).then((row) => row?.value),
    prisma.system.findUnique({ where: { key: "ref_power" } }).then((row) => row?.value),
  ]).then(([ftp_host, ftp_username, ftp_password, ftp_remdir, ftp_port]) => ({
    ftp_host,
    ftp_username,
    ftp_password,
    ftp_remdir,
    ftp_port,
  }));
};

module.exports = {
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
  getSysFTP,
  //	setSysNetworkIP,
  //	setSysNetworkSubnet,
  //	setSysNetworkDNS,
  //	setSysNetworkDHCP
};
