import { Resource } from './resource';
import { CompositionStatus } from './composition-status';
import { CodeableConcept } from './codeable-concept';
import { Reference } from './reference';
import { DocumentReference, DocumentType } from './document-reference';

export enum DocumentRelationshipType {
  replaces = 'replaces',
  transforms = 'transforms',
  signs = 'signs',
  appends = 'appends'
}

export interface DocumentRelationship {
  code: DocumentRelationshipType;
  target: Reference;
}

export interface CompositionSection {
  title?: string;
  author: Reference[];
  entry: Reference[];
}

/**
 * @link https://www.hl7.org/fhir/composition.html
 */
export interface Composition extends Resource {
  status: CompositionStatus;
  type: CodeableConcept;
  subject: Reference;
  date: string;
  author: Reference[];
  title?: string;
  relatesTo?: DocumentRelationship[];
  section: CompositionSection[];
}

export interface CompositionResponse {
  title: string;
  description: string;
  date: string;
  type: DocumentType;
  files: DocumentReference[];
  id: string;
  patient: string;
}
