import dotenv from 'dotenv';

dotenv.config();

import { createServer, Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { CorsOptions } from 'cors';
import jwt from 'jsonwebtoken';
import { Authenticate } from '@signalbot-backend/authenticate';
import {
  IncomingVideoInvitationPayload,
  SocketAction,
  SocketEvent,
  SocketMessage,
  UserData
} from '@signalbot-backend/interfaces';
import { logger, logLevels } from '@signalbot-backend/logger';
import { conf } from '@conf';

const CORS_OPTS: CorsOptions = {
  origin: '*'
};

export class SocketIoServer {
  public io: Server;
  private static instance: SocketIoServer;
  private httpServer: HttpServer = createServer();

  private constructor() {
    this.io = new Server(this.httpServer, {
      cors: CORS_OPTS
    });
  }

  public static getInstance(): SocketIoServer {
    if (!SocketIoServer.instance) {
      SocketIoServer.instance = new SocketIoServer();
    }
    return SocketIoServer.instance;
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.io.use(this.handshakeCheck.bind(this));
      this.io.on('connection', async (socket: Socket) => {
        socket.on(SocketEvent.CLIENT_TO_SERVER, this.socketEventHandler.bind(this));
        this.emitConnected();
      });

      this.httpServer.listen(conf.BACKEND_SOCKET_PORT, '0.0.0.0', () => {
        logger.log(logLevels.info, `Socket.io started at ${conf.BACKEND_SOCKET_PORT}`);
        resolve();
      });
    });
  }

  public emit(socket: Socket, action: SocketAction, data: unknown): void {
    socket.emit(SocketEvent.SERVER_TO_CLIENT, {action, data});
  }

  private emitConnected(): void {
    const sockets : Socket[] = Array.from(this.io.of('/').sockets.values());
    const connectedUsers: string[] = [... new Set(Array.from(sockets).map((socket: Socket) => SocketIoServer.getUserData(socket)._id))];
    sockets.forEach((socket: Socket) => socket.emit(SocketEvent.SERVER_TO_CLIENT, {action: SocketAction.CONNECTED_USERS, data: connectedUsers}));
  }

  private socketEventHandler(message: SocketMessage): void {
    const data: IncomingVideoInvitationPayload = message.data as IncomingVideoInvitationPayload;
    switch(message.action) {
      case SocketAction.INCOMING_VIDEO:
        this.recipientSocket(data.recipient).emit(SocketEvent.SERVER_TO_CLIENT, {action: SocketAction.INCOMING_VIDEO, data});
        break;
      case SocketAction.REJECTED_VIDEO_CONNECTION:
        this.recipientSocket(data.recipient).emit(SocketEvent.SERVER_TO_CLIENT, {action: SocketAction.REJECTED_VIDEO_CONNECTION, data})
        break;
    }
  }

  private recipientSocket(uid: string): Socket {
    return Array.from(this.io.of('/').sockets.values()).find((socket: Socket) => {
      const userData: UserData = SocketIoServer.getUserData(socket);
      return userData._id === uid;
    });
  }

  private handshakeCheck(socket: Socket, next): void {
    const token = socket.handshake.headers['x-auth-token'];
    if (token !== undefined) {
      Authenticate.verify(token)
        .then(() => {
          next();
        })
        .catch((err: unknown) => {
          logger.log(logLevels.error, 'Incorrect handshake', err);
          next(err);
        });
    }
  }

  private static getUserData(socket: Socket): UserData {
    const token: string = socket.handshake.headers['x-auth-token'] as string;
    return jwt.decode(token) as UserData;
  }
}
