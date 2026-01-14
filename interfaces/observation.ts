import { Resource } from './resource';
import { Reference } from './reference';
import { Quantity } from './quantity';
import { DBReferenceRange, ReferenceRange } from './reference-range';
import { CodeableConcept } from './codeable-concept';
import { Annotation } from './annotation';
import { Feeding } from './feeding';

export enum ObservationStatus {
  registered = 'registered',
  preliminary = 'preliminary',
  final = 'final',
  amended = 'amended',
  corrected = 'corrected',
  cancelled = 'cancelled',
  enteredInError = 'entered-in-error',
  unknown = 'unknown'
}

export enum ObservationMethod {
  MAN = 'MAN',
  EQU = 'EQU',
}

export enum BloodPressure {
  SYSTOLIC = 'SYSTOLIC',
  DIASTOLIC = 'DIASTOLIC'
}

export enum ObservationType {
  BodyWeight = 'BodyWeight',
  BodyHeight = 'BodyHeight',
  HeartRate = 'HeartRate',
  BodyTemp = 'BodyTemp',
  BloodPressure = 'BloodPressure',
  GlucoseLevel = 'GlucoseLevel',
  Pain = 'Pain',
  Activity = 'Activity',
  Mood = 'Mood',
  Feeding = 'Feeding',
  BloodType = 'BloodType',
  Saturation = 'Saturation',
  Temperature = 'Temperature'
}

export enum ActivityCode {
  rehab = 'rehab',
  stairs = 'stairs',
  home = 'home',
  walk = 'walk'
}

export interface ObservationComponent {
  code: CodeableConcept;
  valueQuantity?: Quantity
  valueString?: string;
  valueInteger?: number;
  interpretation?: CodeableConcept;
  referenceRange?: (ReferenceRange | DBReferenceRange)[];
}

export interface Observation extends Resource {
  status: ObservationStatus;
  subject: Reference;
  performer: Reference[];
  code: CodeableConcept;
  valueQuantity?: Quantity;
  valueCodeableConcept?: CodeableConcept;
  valueInteger?: number,
  valueString?: string;
  referenceRange?: (ReferenceRange | DBReferenceRange)[];
  interpretation?: CodeableConcept;
  device?: Reference;
  note?: Annotation[];
  method: CodeableConcept;
  effectiveDateTime: string;
  component?: ObservationComponent[];
}

export type ObservationPayloadValue =
  Quantity
  | Quantity[]
  | string
  | number
  | Feeding
  | BloodTypePayload;

export interface ObservationPayload {
  patient?: string;
  value: ObservationPayloadValue;
  note?: string;
  method: ObservationMethod;
  effective: string;
}

export interface ObservationsMap {
  [key: string]: Observation | null;
}

export const OBSERVATION_STATUSES = [
  'registered',
  'preliminary',
  'final',
  'amended',
  'corrected',
  'cancelled',
  'entered-in-error',
  'unknown'
];
export const OBSERVATION_METHODS = [
  'MAN',
  'EQU'
];
export const OBSERVATION_TYPES = [
  'BodyWeight',
  'BodyHeight',
  'HeartRate',
  'BodyTemp',
  'BloodPressure',
  'BloodType',
  'GlucoseLevel',
  'Pain',
  'Activity',
  'Mood',
  'Feeding'
];

export const ACTIVITY_CODES: string[] = [
  'rehab',
  'stairs',
  'home',
  'walk'
];

export enum BloodTypeElement {
  TYPE = 'TYPE',
  RHESUS_FACTOR = 'RHESUS_FACTOR',
}

export enum RhFactor {
  positive = 'positive',
  negative = 'negative',
}

export enum BloodType {
  O = 'O',
  A = 'A',
  B = 'B',
  AB = 'AB'
}

export interface BloodTypePayload {
  type: BloodType;
  rh: RhFactor;
}

export enum BMIInterpretation {
  UNDERWEIGHT = 'UNDERWEIGHT',
  NORMAL = 'NORMAL',
  OVERWEIGHT = 'OVERWEIGHT',
  OBESE = 'OBESE'
}

export interface BmiResponse {
  bmi: number;
  interpretation: CodeableConcept;
}
