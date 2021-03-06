const { Client } = require('pg');

const { config } = require('../config/config');

const USER = encodeURIComponent(config.pgUser);
const PASSWORD = encodeURIComponent(config.pgPassword);
const URI = `postgres://${USER}:${PASSWORD}@${config.pgHost}:${config.pgPort}/${config.pgDatabase}`;

async function getConnection() {
	const client = new Client({ connectionString: URI });
	await client.connect();
	return client;
}

module.exports = getConnection;
