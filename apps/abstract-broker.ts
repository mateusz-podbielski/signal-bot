import dotenv from 'dotenv';

dotenv.config();

import { Context, ServiceBroker, ServiceSchema } from 'moleculer';
import { ServicesNodes } from '../interfaces';

export const TCP_URLS: string[] = [
  `${process.env.BACKEND_TCP_IP}:${process.env.BACKEND_TCP_AUTH_APP_NODE_PORT}/${ServicesNodes.AUTH_APP_NODE}`,
  `${process.env.BACKEND_TCP_IP}:${process.env.BACKEND_TCP_API_NODE_PORT}/${ServicesNodes.API_NODE}`,
  `${process.env.BACKEND_TCP_IP}:${process.env.BACKEND_TCP_SOCKET_IO_NODE_PORT}/${ServicesNodes.SOCKET_IO_NODE}`
];

export abstract class AbstractBroker {
  public broker: ServiceBroker;
  protected abstract schema: ServiceSchema;

  protected constructor(nodeID: ServicesNodes) {
    this.broker = new ServiceBroker({
      nodeID,
      transporter: {
        type: 'TCP',
        options: {
          udpDiscovery: false,
          urls: TCP_URLS
        }
      }
    });
  }

  public static contextParams<T>(ctx: Context): T {
    return ctx.params as T;
  }

  public start(): Promise<void> {
    this.broker.createService(this.schema);
    return this.broker.start();
  }
}
