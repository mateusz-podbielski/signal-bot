import { FhirPractitionerRoleResource, FhirResource } from '@signalbot-backend/fhir-connector';
import {
  BundleEntry,
  BundleResponse,
  CareTeamResources,
  FhirResourceId,
  PractitionerRole,
  Resource,
  ResourceType
} from '@signalbot-backend/interfaces';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { getFhirResourceId } from '@signalbot-backend/user-resource';
import { CareTeamController } from './care-team.controller';

export class PractitionerController {
  private practitionerRoleResource: FhirPractitionerRoleResource = new FhirPractitionerRoleResource();
  private careTeamController: CareTeamController = new CareTeamController();

  public getPractitionerRoleResource(uid: string): Promise<PractitionerRole> {
    return getFhirResourceId(uid).then((fhirResourceId: FhirResourceId) => {
      if (fhirResourceId.resourceType !== ResourceType.Practitioner) {
        throw new CustomError(ErrorCode.METHOD_NOT_ALLOWED, 'User is not Practitioner');
      }
      return fhirResourceId.fhirId;
    })
      .then((fhirId: string) => this.practitionerRoleResource.getByPractitionerId(fhirId));
  }

  public async getPractitionerRoleById(practitionerId: string, uid: string): Promise<PractitionerRole> {
    const sameCareTeam: boolean = await new CareTeamController().sameCareTeam(practitionerId, uid);
    if (!sameCareTeam) {
      throw new CustomError(ErrorCode.OPERATION_CAN_NOT_BE_PERFORMED, 'User and practitioner are not in the same CareTeam');
    }

    return this.getPractitionerRoleResource(practitionerId);
  }

  public getPractitionerCareTeams(uid: string): Promise<CareTeamResources[]> {
    return this.careTeamController
      .getCareTeamByResourceWithMembers(uid, uid, ResourceType.Practitioner, false)
      .then((members: CareTeamResources[]) => members.filter((member: Resource) => member.resourceType === ResourceType.Practitioner && member))
  }


  public async getCareTeamsMembers(uid: string): Promise<CareTeamResources[]> {
    const fhirResId: FhirResourceId = await FhirResource.getFhirResourceId(uid);

    return new FhirResource(ResourceType.CareTeam)
      .search(`participant=Practitioner/${fhirResId.fhirId}&_include=CareTeam:participant`)
      .then((response: BundleResponse<CareTeamResources>) => response.entry)
      .then((entries: BundleEntry<CareTeamResources>[]) => entries.map((entry: BundleEntry<CareTeamResources>) => entry.resource))
      .then((resources: CareTeamResources[]) => resources.filter((resource: Resource) => resource.resourceType === ResourceType.Practitioner && resource.id === fhirResId.fhirId));
  }
}
