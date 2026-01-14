import { Resource } from './resource';
import { CodeableConcept } from './codeable-concept';
import { Reference } from './reference';

export enum AppointmentStatus {
  proposed = 'proposed',
  pending = 'pending',
  booked = 'booked',
  arrived = 'arrived',
  fulfilled = 'fulfilled',
  cancelled = 'cancelled',
  noshow = 'noshow',
  enteredInError = 'entered-in-error',
  checkedIn = 'checked-in',
  waitlist = 'waitlist'
}

export enum AppointmentParticipantStatus {
  accepted = 'accepted',
  declined = 'declined',
  tentative = 'tentative',
  needsAction = 'needsAction'
}

export enum AppointmentParticipantRequired {
  required = 'required',
  optional = 'optional',
  informationOnly = 'information-only',
}

export interface AppointmentParticipant {
  type: CodeableConcept[]; // Role of participant in the appointment
  actor: Reference; // Person; Location/HealthcareService or Device
  required: AppointmentParticipantRequired; // required | optional | information-only
  status: AppointmentParticipantStatus;
}

export interface Appointment extends Resource {
  status: AppointmentStatus;
  description: string;
  participant: AppointmentParticipant[];
  created: string;
  start: string;
  end: string;
  priority: number;
  appointmentType?: CodeableConcept;
}

export interface AppointmentPayload {
  description: string;
  patient: string;
  specialist: string;
  start: string;
  end: string;
  priority: number;
}

export enum AppointmentType {
  HOME = 'HOME',
  VIDEO = 'VIDEO',
  HOSP = 'HOSP',
  CLINIC = 'CLINIC',
  OTHER = 'OTHER',
}

export enum AppointmentParticipantRole {
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  RELATED = 'RELATED',
  PATIENT = 'PATIENT',
  CONSULT = 'CONSULT',
  THERAP = 'THERAP',
  OTHER = 'OTHER',
}

export const APPOINTMENT_STATUSES: string[] = [
  'proposed',
  'pending',
  'booked',
  'arrived',
  'fulfilled',
  'cancelled',
  'noshow',
  'entered-in-error',
  'checked-in',
  'waitlist'
];
