import { Resource} from './resource';
import { Identifier } from './identifier';
import { ContactPoint } from './contact-point';
import { Reference } from './reference';
import { CodeableConcept } from './codeable-concept';
import { RelatedPerson } from './related-person';
import { Practitioner } from './practitioner';
import { Patient } from './patient';

export enum CareTeamStatus {
  proposed = 'proposed',
  active = 'active',
  suspended = 'suspended',
  inactive = 'inactive',
  enteredInError = 'entered-in-error'
}

export enum CareTeamRoleCode {
  PRIM_PHYS = 'PRIM_PHYS',
  PHYS = 'PHYS',
  NURSE = 'NURSE',
  THERAP = 'THERAP',
  PSY = 'PSY',
  PATIENT = 'PATIENT',
  RELATED = 'RELATED',
  OTHER = 'OTHER'
}

export interface CareTeamRole {
  coding: {
    code: CareTeamRoleCode
  }
  text: string;
}

export interface CareTeamParticipant {
  role: CodeableConcept[];
  member: Reference;
  onBehalfOf?: Reference;
}

/**
 * @link https://www.hl7.org/fhir/careteam.html
 */
export interface CareTeam extends Resource {
  identifier?: Identifier;
  subject?: Reference;
  name: string;
  status: CareTeamStatus,
  participant: CareTeamParticipant[];
  telcom?: ContactPoint[];
}

export type CareTeamResources = RelatedPerson | Practitioner | Patient;
