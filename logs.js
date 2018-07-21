'use strict';

const winston = require('winston');

const logs = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({'timestamp':true})
  ]
});

module.exports = logs