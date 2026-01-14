import { conf } from '@conf';
import mongoose, { ConnectionOptions } from 'mongoose';
import { logger } from '@signalbot-backend/logger';

const MONGO_CONNECT_OPTIONS: ConnectionOptions = {
  pass: process.env.BACKEND_MONGO_PASS,
  user: process.env.BACKEND_MONGO_USER,
  dbName: conf.MONGO_DB_NAME,
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
};

export async function connectMongoDB(): Promise<string> {
    const mongoHost: string = process.env.BACKEND_MONGO_HOST || conf.BACKEND_MONGO_HOST;
    const mongoPort: string = process.env.BACKEND_MONGO_PORT || conf.BACKEND_MONGO_PORT;
    const mongoUrl = `mongodb://${mongoHost}:${mongoPort}`;
    await mongoose.connect(mongoUrl, MONGO_CONNECT_OPTIONS).then(() => {
      mongoose.connection.on('error', (error: unknown) => {
        logger.log('error', 'MongoDB connection error', error);
        throw error;
      });
    });
    return mongoUrl;
  }
