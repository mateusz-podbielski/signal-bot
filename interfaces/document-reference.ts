import { Resource } from './resource';
import { Reference } from './reference';
import { Attachment } from './attachment';
import { CodeableConcept } from './codeable-concept';
import { CompositionStatus } from './composition-status';

export enum DocumentReferenceStatus {
  current = 'current',
  superseded = 'superseded',
  enteredInError = 'entered-in-error'
}

export interface DocumentContent {
  attachment: Attachment;
}

export enum DocumentType {
  bill = 'bill',
  recipe = 'recipe',
  medicalReport = 'medicalReport',
  testResult = 'testResult',
  otherMedical = 'otherMedical',
  other = 'other'
}

/**
 * @link http://hl7.org/fhir/documentreference.html
 */
export interface DocumentReference extends Resource {
  status: DocumentReferenceStatus;
  docStatus: CompositionStatus;
  subject: Reference;
  author: Reference[];
  content: DocumentContent[];
  date: string;
  type: CodeableConcept;
  description: string;
}

export interface DocumentPayload {
  documentType: DocumentType;
  description?: string;
  patient: string;
  title?: string;
}
