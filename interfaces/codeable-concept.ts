import { CodingSystem } from './value-sets';

/**
 * @link http://hl7.org/fhir/datatypes.html#CodeableConcept
 */
export interface CodeableConcept {
  coding: Coding[];
  text: string;
}

/**
 * @link http://hl7.org/fhir/datatypes.html#Coding
 */
export interface Coding {
  system: CodingSystem;
  version?: string;
  code: unknown;
  display: string;
  userSelected?: boolean;
}
