import winston, { transports, format } from 'winston';
import { logLevels } from './log-levels';
import 'winston-mongodb';
import { MongoDBConnectionOptions } from 'winston-mongodb';
import { conf } from '@conf';

const mongoHost: string = process.env.BACKEND_MONGO_HOST || conf.BACKEND_MONGO_HOST;
const mongoPort: string = process.env.BACKEND_MONGO_PORT || conf.BACKEND_MONGO_PORT;

const { combine, timestamp, prettyPrint, json, errors, colorize, simple } = winston.format;

function transportOptions(level: logLevels): MongoDBConnectionOptions {
  return {
    db: `mongodb://${process.env.BACKEND_MONGO_USER}:${process.env.BACKEND_MONGO_PASS}@${mongoHost}:${mongoPort}`,
    level,
    options: {
      useNewUrlParser: true, useUnifiedTopology: true, dbName: 'signalbot-logs'
    },
    name: 'mongodb',
    collection: level,
    tryReconnect: true,
  }
}

export const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    prettyPrint({depth: 5}),
    json(),
    errors({stack: true}),
    format.metadata(),
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new transports.MongoDB(transportOptions(logLevels.info)),
    new transports.MongoDB(transportOptions(logLevels.error)),
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'silly' : 'info',
      format: combine(colorize(), simple()),
    }),
  ]
});
