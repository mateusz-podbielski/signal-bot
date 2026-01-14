export enum SocketAction {
  INCOMING_VIDEO = 'INCOMING_VIDEO',
  REJECTED_VIDEO_CONNECTION = 'REJECTED_VIDEO_CONNECTION',
  CONNECTED_USERS = 'CONNECTED_USERS'
}

export enum SocketEvent {
  CLIENT_TO_SERVER = 'CLIENT_TO_SERVER',
  SERVER_TO_CLIENT = 'SERVER_TO_CLIENT'
}

export interface SocketMessage {
  action: SocketAction;
  data: unknown;
}

export interface IncomingVideoInvitationPayload {
  token: string;
  sender: string;
  recipient: string;
  room: string;
}

export interface RejectedVideoConnection {
  sender: string;
  recipient: string;
  room: string;
}
