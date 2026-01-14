import { Document, Types } from 'mongoose';

export interface AppMessage {
  message: string;
  from?: Types.ObjectId;
  to: Types.ObjectId;
  createdAt?: string;
  action?: AppMessageAction;
  _id?: string;
}

export enum AppMessageActionType {
  EXTERNAL = 'EXTERNAL',
  INTERNAL = 'INTERNAL',
}

export interface AppMessageAction {
  actionType: AppMessageActionType;
  url: string;
}

export type DBAppMessage = AppMessage & Document;
