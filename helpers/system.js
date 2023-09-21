const { readFile, writeFile } = require("fs/promises");
const ping = require("ping");

const { cmd } = require("./utils");

const NETPLAN_FILE = "/etc/netplan/00-installer-config.yaml";

const allNetworks = () => cmd("ip addr")
	.then(lines => lines
		.match(/\b\d+[^\n]+\n( [^\n]+\n)*/g)
		.map(adap => adap
			.split("\n")
			.filter(line => line !== "" && !/^       /.test(line) && !/^    inet6/.test(line) && !/^    link/.test(line))
			.reduce((acc, line, i) => {
				if (i === 0) {
					const arr = line.trim().match(/^\d+: ([^:]+): <([^>]+)>.+$/);
					return { name: arr[1], isUp: arr[2].split(",").includes("UP"), isLoopback: arr[2].split(",").includes("LOOPBACK"), addresses: []  };
				} else {
					const arr = line.trim().match(/^inet (\d+\.\d+\.\d+\.\d+)\/(\d+) (.+)$/);
					return { ...acc, addresses: [ ...acc.addresses, { address: arr[1], submask: parseInt(arr[2]), dynamic: /dynamic/.test(arr[3]) } ] };
				}
			}, {})
		)
		.filter(({ isLoopback }) => !isLoopback)
		.map(({ name, isUp, addresses }) => ({ name, isUp, addresses }))
	)
	.then(networks => cmd("ip route show")
		.then(routes => routes
			.split("\n")
			.filter(line => /^default/.test(line))
			.map(line => line.trim().match(/^default via ([^ ]+) dev ([^ ]+) .+$/))
			.reduce((acc, [ _, gateway, name ]) => ({ ...acc, [name]: gateway }), {})
		)
		.then(gateways => networks
			.map(network => ({ ...network, gateway: gateways[network.name] ?? null }))
//			.reduce((acc, { name, ...rest }) => ({ ...acc, [name]: rest }), {})
		)
	);


/*		.split("\n")
		.filter(line => /^\d+: /.test(line))
		.map(line => {
			const m = line.match(/^\d+: ([^:]+): <([^>]+)>.+$/);
			const tags = m[2].split(",");
			return {
				name: m[1],
				isUp: tags.includes("UP"),
				isLoopback: tags.includes("LOOPBACK")
			};
		})
		.filter(({ isLoopback }) => !isLoopback)
		.map(({ name, isUp }) => ({ name, isUp }))
	);*/

const netplan2Obj = lines => lines
		.split("\n")
//		.filter(line => !/^#/.test(line) && line !== "" && !/^ *network:/.test(line) && !/^ *ethernets:/.test(line) && !/^ *version:/.test(line))
		.filter(line => /^    /.test(line))
		.map(line => line.replace(/^    /, ""))
		.map(line => line.replace(/:$/, ""))
		.map(line => {
			const arr = line.split(":").map(s => s.trim());
			return {
				level: line.search(/[^ ]/) / 2,
				key: arr[0],
				value: arr[1]
			};
		})
		.reduce((acc, { level, key, value }, i, a) => {
			if (level === 1 && key === "nameservers" && i < a.length - 1 && a[i+1].level === 2 && a[i+1].key === "addresses")
				return [ ...acc, { level, key: "nameservers", value: a[i+1].value } ];
			if (level === 2 && key === "addresses" && i > 0 && a[i-1].level === 1 && a[i-1].key === "nameservers")
				return acc;
			return [ ...acc, { level, key, value } ];
		}, [])
		.map(({ level, key, value }) => {
			switch (key) {
			case "dhcp4":
				value = ["yes", "true"].includes(value);
				break;
			case "addresses":
				value = value
					.replace(/^\[(.+)\]$/, "$1")
					.split(",")
					.map(addr => addr.split("/"))
					.map(([ address, submask]) => ({ address, submask: parseInt(submask) }));
				break;
			case "nameservers":
				value = value
					.replace(/^\[(.*)\]$/, "$1")
					.split(",")
					.filter(line => line !== "");
				break;
			default:
			}
			return { level, key, value };
		})
		.reduce((acc, { level, key, value }) => {
			if (level === 0) {
				acc.key = key;
				acc.value[key] = {};
			} else
				acc.value[acc.key][key] = value;
			return acc;
		}, { key: null, value: {} })
		.value;

const getNetworks = () => readFile(NETPLAN_FILE, "utf8")
	.then(netplan2Obj)
	.then(netplan => allNetworks()
		.then(networks => {
			networks.forEach(({ name, isUp, addresses, gateway }) => {
				if (netplan[name] === undefined)
					netplan[name] = { name, isUp, addresses, gateway };
				else {
					netplan[name].addresses = addresses.map(({ address, submask }) => ({ address, submask }));
					netplan[name].gateway4 = gateway;
				}
			});
			return Object
				.entries(netplan)
				.reduce((acc, [ name, obj ]) => ([ ...acc, { name, ...obj } ]), []);
		})
	);

const obj2Netplan = netplan => `# This is the network config written by 'subiquity'\nnetwork:\n  ethernets:\n` + netplan
	.filter(({ name, ...rest }) => Object.keys(rest).length > 0)
	.map(({ name, ...rest }) => `    ${name}:\n` + Object
		.entries(rest)
		.filter(([ key, value ]) => value !== null)
		.map(([ key, value ]) => {
			switch (key) {
			case "dhcp4":
				return `      ${key}: ${value ? "true" : "false"}`;
			case "addresses":
				return `      ${key}: [${value.map(({ address, submask }) => `${address}/${submask}`).join(",")}]`;
			case "nameservers":
				return `      ${key}:\n        addresses: [${value.join(",")}]`;
			case "gateway4":
				if (value === "")
					return "";
				return `      ${key}: ${value}`;
			default:
				return `      ${key}: ${value}`;
			}
		})
		.join("\n")
	)
	.join("\n") + `\n  version: 2\n  renderer: networkd\n  vlans: {}\n  bridges: {}\n`;

const setNetworks = netplan => Promise.all(netplan
		.filter(({ up }) => up === false)
		.map(({ name }) => cmd(`ip link set ${name} down`))
	)
	.then(() => netplan
		.filter(({ up }) => up !== false)
	)
	.then(np => writeFile(NETPLAN_FILE, obj2Netplan(np), { mode: 0o644 }))
	.then(() => cmd("netplan apply"))
	.catch(e => e);

const isIPVisible = ip => ping
	.promise
	.probe(ip)
	.then(({ alive }) => alive);

module.exports = {
	getNetworks,
	setNetworks,
	allNetworks,
	isIPVisible
};

