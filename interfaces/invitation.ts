import {ResourceType} from './resource';
import {Document, Types} from 'mongoose';

export enum InvitationState {
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED'
}
export interface Invitation {
  _id?: string;
  uid: Types.ObjectId;
  phoneNumber: string;
  patientId?: string;
  resourceType: ResourceType;
  firstName: string;
  lastName: string;
  createdAt?: string;
  state: InvitationState;
  tokenId?: string;
}

export type DBInvitation = Invitation & Document;
