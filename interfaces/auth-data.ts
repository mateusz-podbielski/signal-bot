import { FamilyRelation } from './family-relation';
import { PractitionerRoleCode } from './practitioner-role';

export interface AuthData {
  phoneNumber: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  practitionerRole?: PractitionerRoleCode;
  identifier?: string;
  familyRelation?: FamilyRelation;
  academicTitle?: string;
}

export interface SimpleAuth {
  password: string;
  phoneNumber: string;
}

export enum AuthActions {
  loginPassAuth = 'loginPassAuth',
  generateRefreshToken = 'generateRefreshToken',
  renewAuthToken = 'renewAuthToken'
}

