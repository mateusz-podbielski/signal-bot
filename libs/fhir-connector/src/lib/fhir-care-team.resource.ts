import {
  CareTeam,
  CareTeamParticipant,
  CareTeamRoleCode,
  CareTeamStatus,
  ResourceType,
  HumanName, CodeableConcept, CodingSystem
} from '@signalbot-backend/interfaces';
import { FhirResource } from './fhir-resource';

export class FhirCareTeamResource extends FhirResource {
  constructor() {
    super(ResourceType.CareTeam);
  }

  public static async build(name: HumanName, resourceId: string): Promise<CareTeam> {
    const patientRole: CodeableConcept = await FhirResource
      .codeableConceptBuilder(CodingSystem.CareTeamRoles, CareTeamRoleCode.PATIENT);

    const careTeamParticipant: CareTeamParticipant = {
      role: [patientRole],
      member: FhirResource.referenceBuilder(ResourceType.Patient, resourceId)
    };

    return {
      resourceType: ResourceType.CareTeam,
      name: `${name.family}-${name.given.join('-')}-team`,
      status: CareTeamStatus.proposed,
      subject: FhirResource.referenceBuilder(ResourceType.Patient, resourceId),
      participant: [careTeamParticipant]
    };
  }
}
