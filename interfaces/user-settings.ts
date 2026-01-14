import { Document, Types } from 'mongoose';

export interface UserSettings {
  messages: boolean;
  notifications: boolean;
  measurements: boolean;
  uid: Types.ObjectId;
}

export type DBUserSettings = UserSettings & Document;
