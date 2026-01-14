export const VALUE_SET_NAMES: string[] = [
  'AcademicTitles',
  'AppointmentParticipantRole',
  'BloodPressure',
  'BloodTypeElement',
  'BmiInterpretation',
  'CareTeamRoles',
  'ChargeItemType',
  'DocumentType',
  'FamilyRelations',
  'FeedingComponents',
  'IdentifierType',
  'MedicalSpecialization',
  'ObservationCategory',
  'ObservationInterpretation',
  'ObservationMethod',
  'ObservationType',
  'PractitionerRole',
  'ServiceRequestType',
  'VisitType',
];

export enum CodingSystem {
  AcademicTitles = '/ValueSet/AcademicTitles',
  AppointmentParticipantRole = '/ValueSet/AppointmentParticipantRole',
  BloodPressure = '/ValueSet/BloodPressure',
  BloodTypeElement = '/ValueSet/BloodTypeElement',
  BmiInterpretation = '/ValueSet/BmiInterpretation',
  CareTeamRoles = '/ValueSet/CareTeamRoles',
  ChargeItemType = '/ValueSet/ChargeItemType',
  DocumentType = '/ValueSet/DocumentType',
  FamilyRelations = '/ValueSet/FamilyRelations',
  FeedingComponents = '/ValueSet/FeedingComponents',
  IdentifierType = '/ValueSet/IdentifierType',
  MedicalSpecialization = '/ValueSet/MedicalSpecializatiosn',
  ObservationCategory = '/ValueSet/ObservationCategory',
  ObservationInterpretation = '/ValueSet/ObservationInterpretation',
  ObservationMethod = '/ValueSet/ObservationMethod',
  ObservationType = '/ValueSet/ObservationType',
  PractitionerRole = '/ValueSet/PractitionerRole',
  ServiceRequestType = '/ValueSet/ServiceRequestType',
  VisitType = '/ValueSet/VisitType',
}

export interface ValueSetItem {
  code: string;
  display: string;
}

export interface ValueSetConcept {
  concept: ValueSetItem[];
}
export interface ValueSetsResponse {
  resourceType: string;
  id: string;
  system: string;
  version: string;
  name: string;
  status: string;
  publisher: string;
  url: string;
  compose: {
    include: ValueSetConcept[];
  }
}
