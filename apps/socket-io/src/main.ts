import { connectMongoDB } from '@signalbot-backend/mongo-connect';
import { SocketIoServer } from './app/socket-io-server';
import { SocketServiceBroker } from './app/socket-service-broker';

connectMongoDB()
  .then(() => SocketIoServer.getInstance().start())
  .then(() => new SocketServiceBroker().start());
