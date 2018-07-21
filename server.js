'use strict';

const cluster = require('cluster');
const app = require('./index.js');
const log = require('./logs');

const NUM_CPU = process.env.WORKERS || require('os').cpus().length;
const PORT = process.env.PORT || 3033;

let server;

process.on('uncaughtException', function (err) {
	log.error('uncaughtException', err);
	log.warn('Exiting with code 1');
	process.exit(1);
})

cluster.on('exit', (worker) => {
	log.warn('Worker exited', { pid : worker.id });
	if (NUM_CPU > 1) {
		log.info('Forking new worker process');
		cluster.fork();
	}
})

if (NUM_CPU === 1 || cluster.isWorker) {
	app.set('port', PORT);
	server = app.listen(app.get('port'), () => {
		log.info(`Express server listening`, { port : server.address().port, pid : process.pid });
	});
} else if (cluster.isMaster) {
	log.info(`Forking ${NUM_CPU} workers`);
	for (let i = 0; i < NUM_CPU; i++) {
		cluster.fork();
	}
}