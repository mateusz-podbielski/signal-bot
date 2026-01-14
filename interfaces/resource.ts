import { Meta } from './meta';
import { CodeableConcept } from './codeable-concept';

export enum ResourceType {
  Patient = 'Patient',
  RelatedPerson = 'RelatedPerson',
  Practitioner = 'Practitioner',
  PractitionerRole = 'PractitionerRole',
  Location = 'Location',
  CareTeam = 'CareTeam',
  Person = 'Person',
  Bundle = 'Bundle',
  ServiceRequest = 'ServiceRequest',
  ChargeItem = 'ChargeItem',
  DocumentReference = 'DocumentReference',
  Composition = 'Composition',
  Observation = 'Observation',
  Schedule = 'Schedule',
  Appointment = 'Appointment',
  Device = 'Device',
}

export interface Resource {
  resourceType: ResourceType,
  meta?: Meta
  id?: string;
  extension?: ResourceExtension[];
}

export interface ResourceExtension {
  url: ExtensionUrl;
  valueString?: string;
  valueCodeableConcept?: CodeableConcept;
}

export interface FhirResourceId {
  fhirId: string;
  resourceType: ResourceType;
}

export enum ExtensionUrl {
  familyRelation = 'familyRelation',
  name = 'name',
  description = 'description',
  title = 'title'
}
