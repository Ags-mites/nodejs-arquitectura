import winston from 'winston';
import path from 'path';
import fs from 'fs';

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  ),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  ),
);

const transports = [
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat
  }),

  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880,
    maxFiles: 5,
  }),

  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format: fileFormat,
    maxsize: 5242880,
    maxFiles: 5,
  })
];

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports,
  exitOnError: false,
});

const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

logger.logRequest = (req, res, responseTime) => {
  const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms - ${req.ip}`;
  if (res.statusCode >= 400) {
    logger.error(message);
  } else {
    logger.http(message);
  }
};

logger.logSOAPError = (operation, error, requestData = null) => {
  const errorInfo = {
    operation,
    error: error.message,
    errorCode: error.errorCode || 'UNKNOWN',
    requestData: requestData ? JSON.stringify(requestData) : null,
    timestamp: new Date().toISOString()
  };

  logger.error(`SOAP Error - ${operation}: ${JSON.stringify(errorInfo)}`);
};

logger.logSOAPSuccess = (operation, trackingNumber, responseTime) => {
  logger.info(`SOAP Success - ${operation}: trackingNumber=${trackingNumber}, responseTime=${responseTime}ms`);
};

logger.logDatabaseOperation = (operation, details) => {
  logger.debug(`DB Operation - ${operation}: ${details}`);
};

logger.logAppEvent = (event, details = '') => {
  logger.info(`App Event - ${event}: ${details}`);
};

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export const {
  error,
  warn,
  info,
  debug,
  http,
  logRequest: logRequestFn,
  logSOAPError,
  logSOAPSuccess,
  logDatabaseOperation,
  logAppEvent
} = logger;

export { logger as default };
