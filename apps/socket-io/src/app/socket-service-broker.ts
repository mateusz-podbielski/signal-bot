import { ServiceSchema } from 'moleculer';
import { Socket } from 'socket.io';
import { SocketStore } from './socket-store';
import { BrokerServiceName, ServicesNodes, SocketAction, SocketEvent } from '@signalbot-backend/interfaces';
import { AbstractBroker } from '../../../abstract-broker';
import { SocketIoServer } from './socket-io-server';

export class SocketServiceBroker extends AbstractBroker {
  private socketServer: SocketIoServer = SocketIoServer.getInstance();
  private socketStore: SocketStore = SocketStore.getInstance();

  protected schema: ServiceSchema = {
    name: BrokerServiceName.SOCKET_IO_SERVICE,
    actions: {
      connected: this.connected,
      broadcast: this.broadcast,
      emit: this.emit
    }
  };

  constructor() {
    super(ServicesNodes.SOCKET_IO_NODE);
  }

  private connected(uid: string) {
    return SocketStore.getInstance().getSocket(uid) !== undefined;
  }

  private broadcast(roomId: string, action: SocketAction, data: unknown) {
    this.socketServer.io.of(roomId).emit(SocketEvent.SERVER_TO_CLIENT, {
      action: action,
      data: data,
    });
  }

  private emit(uid: string, action: SocketAction, data: unknown) {
    const socket: Socket = this.socketStore.getSocket(uid);
    this.socketServer.emit(socket, action, data);
  }
}
