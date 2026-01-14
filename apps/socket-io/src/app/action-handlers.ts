import { Socket } from 'socket.io';
import { IncomingVideoInvitationPayload, SocketAction, SocketEvent } from '@signalbot-backend/interfaces';
import { SocketStore } from './socket-store';

export class ActionHandlers {
  private socketStore: SocketStore = SocketStore.getInstance();

  public incomingVideo(payload: IncomingVideoInvitationPayload): void {
    const recipientSocket: Socket = this.socketStore.getSocket(payload.recipient);
    recipientSocket.emit(SocketEvent.SERVER_TO_CLIENT, {action: SocketAction.INCOMING_VIDEO, data: payload});
  }
}
