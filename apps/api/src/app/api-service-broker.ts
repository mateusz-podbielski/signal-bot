import { ServiceSchema } from 'moleculer';
import { BrokerServiceName, ServicesNodes } from '@signalbot-backend/interfaces';
import { AbstractBroker } from '../../../abstract-broker';

export class ApiServiceBroker extends AbstractBroker {
  protected schema: ServiceSchema = {
    name: BrokerServiceName.API_SERVICE,
  };

  private static instance: ApiServiceBroker;

  private constructor() {
    super(ServicesNodes.API_NODE);
    this.start().then(() => void 0);
  }

  public static getInstance(): ApiServiceBroker {
    if (!ApiServiceBroker.instance) {
      ApiServiceBroker.instance = new ApiServiceBroker();
    }
    return ApiServiceBroker.instance;
  }

  public isConnected(uid: string): Promise<boolean> {
    return this.broker.call<boolean, {uid: string}>(`${BrokerServiceName.SOCKET_IO_SERVICE}.connected`, {uid});
  }
}
