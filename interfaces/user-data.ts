import {Request} from 'express';
import {Role} from './role';

export interface UserData {
    _id: string;
    roles: Role[];
}

export interface UserDataRequest extends Request {
  userData?: UserData;
}
