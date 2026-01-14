import { Role } from './role';
import { Document, Model, Types } from 'mongoose';
import { DBInvitation } from './invitation';
import { DBAppMessage } from './app-message';

export interface DBFcmToken extends Document {
  token: string;
}

export interface User {
  _id: string;
  fhirId?: string;
  email: string;
  phoneNumber: string;
  password: string;
  roles: Role[];
  loginAttempts: number;
  lockUntil: number;
  confirmed: boolean;

  isLocked(): boolean;

  incLoginAttempts(): Promise<void>;

  resetLoginAttempt(): Promise<void>;

  authCodeCount: number;
  lastAuthCode: Date;
  invitations?: Types.DocumentArray<DBInvitation>;
  appMessages?: Types.DocumentArray<DBAppMessage>;
  fcmToken?: Types.DocumentArray<DBFcmToken>;
  lastLogin?: string;
}

export type DBUser = User & Document;

export interface UserModelInterface extends Model<DBUser> {
  authenticate(phoneNumber: string, password: string): Promise<DBUser>;
}

export interface UserPhone {
  phoneNumber: string;
  uid: string;
}
