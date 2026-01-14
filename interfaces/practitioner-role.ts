import { Resource, ResourceType } from './resource';
import { Identifier } from './identifier';
import { Reference } from './reference';
import { CodeableConcept } from './codeable-concept';

export enum PractitionerRoleCode {
  /**
   * general physician
   */
  PHY = 'PHY',
  /**
   * nurse
   */
  NRS = 'NRS',
  /**
   * therapist
   */
  THE = 'THE',
  /**
   * psychologist
   */
  PSY = 'PSY',
  /**
   * other not classified
   */
  OTH = 'OTH'
}

/**
 * @link https://www.hl7.org/fhir/practitionerrole.html
 */
export interface PractitionerRole extends Resource {
  resourceType: ResourceType;
  identifier: Identifier[];
  active: boolean;
  practitioner: Reference;
  location?: Location[];
  specialty?: CodeableConcept[];
  code: CodeableConcept[];
}
