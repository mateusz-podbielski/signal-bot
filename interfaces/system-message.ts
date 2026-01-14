import { Document, Types } from 'mongoose';

export interface SystemMessage {
  message: string;
  title: string;
  email: string;
  sendCopyToUser: boolean;
  type: SystemMessageType,
  uid: Types.ObjectId;
  _id?: string;
}

enum SystemMessageType {
  SERVICE_REQUEST = 'SERVICE_REQUEST',
  ISSUE = 'ISSUE',
  OTHER = 'OTHER',
}

export type DBSystemMessage = Document & SystemMessage;
