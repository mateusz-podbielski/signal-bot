import { Socket } from 'socket.io';

export class SocketStore {
  private sockets: Map<string, Socket> = new Map<string, Socket>();
  private static instance: SocketStore;

  public addSocket(uid: string, socket: Socket): void {
    this.sockets.set(uid, socket);
  }

  public getSocket(uid: string): Socket {
    return this.sockets.get(uid);
  }

  public getAll(): Socket[] {
    return Array.from(this.sockets.values());
  }
  public removeSocket(uid: string): void {
    this.sockets.delete(uid);
  }

  public getClientBySocketId(socketId: string): string {
    return Array.from(this.sockets.entries())
      .filter(([id, socket]: [string, Socket]) => socket.id === socketId)
      .map<string>(([key]: [string, Socket]) => key)[0];
  }

  public static getInstance(): SocketStore {
    if (!SocketStore.instance) {
      SocketStore.instance = new SocketStore();
    }
    return SocketStore.instance;
  }
}

