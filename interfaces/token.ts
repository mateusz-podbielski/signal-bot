import {Document} from 'mongoose';

export interface Token {
  hash: string;
  expiresIn: number;
  _id: string;
}

export interface TokenData {
  token: string;
  id: string;
}

export interface TokenPayload {
  data: Record<string, unknown>;
  action?: TokenAction;
  exp?: number;
  sub?: TokenAction;
  jit?: string;
}

export type DBToken = Token & Document

export enum TokenAction {
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  INVITE_MEMBER = 'INVITE_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  REFRESH = 'REFRESH',
  AUTH_TOKEN = 'AUTH_TOKEN'
}
