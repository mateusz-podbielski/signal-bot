import { ResourceType, Role } from '@signalbot-backend/interfaces';

export const rolesMap: { [key: string]: ResourceType } = {
  [Role.patient]: ResourceType.Patient,
  [Role.relatedPerson]: ResourceType.RelatedPerson,
  [Role.physician]: ResourceType.Practitioner,
  [Role.nurse]: ResourceType.Practitioner,
  [Role.therapist]: ResourceType.Practitioner
};
