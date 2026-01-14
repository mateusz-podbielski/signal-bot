import { Resource } from './resource';
import { Reference } from './reference';
import { Annotation } from './annotation';
import { CodeableConcept } from './codeable-concept';

export enum ServiceRequestStatus {
  draft = 'draft',
  active = 'active',
  onHold = 'on-hold',
  revoked = 'revoked',
  completed = 'completed',
  enteredInError = 'entered-in-error',
  unknown = 'unknown'
}

export enum ServiceRequestType {
  SHOPPING = 'SHOPPING',
  MEDICINES = 'MEDICINES',
  DOCTOR_APP = 'DOCTOR_APP',
  TRANSPORT = 'TRANSPORT',
  OTHER = 'OTHER',
}

export enum ServiceRequestPriority {
  routine = 'routine',
  urgent = 'urgent',
  asap = 'asap',
  stat = 'stat'
}

/**
 * http://hl7.org/fhir/servicerequest.html
 */
export interface ServiceRequest extends Resource {
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  subject: Reference;
  requester: Reference;
  performer: Reference;
  note: Annotation[];
  code: CodeableConcept;
  occurrenceDateTime: string;
}

export interface ServiceRequestPayload {
  patientId: string;
  performerId: string;
  noteText: string;
  occurrenceDateTime: string;
  code: string;
}
