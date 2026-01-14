import { connectMongoDB } from '@signalbot-backend/mongo-connect';
import { AuthAppBroker } from './app/auth-app-broker';

connectMongoDB()
  .then(() => new AuthAppBroker().start());
