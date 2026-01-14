import { flatten, intersection } from 'lodash';
import { FhirPractitionerRoleResource, FhirResource } from '@signalbot-backend/fhir-connector';
import {
  BundleEntry,
  BundleResponse,
  CareTeam,
  CareTeamParticipant,
  CareTeamResources,
  CareTeamRoleCode,
  CodeableConcept,
  CodingSystem,
  FhirResourceId,
  JsonPatch,
  JsonPatchOperation,
  Practitioner,
  PractitionerRole,
  PractitionerRoleCode,
  RelatedPerson,
  ResourceType
} from '@signalbot-backend/interfaces';
import { getFhirResourceId } from '@signalbot-backend/user-resource';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';

export class CareTeamController {
  private fhirResource = new FhirResource(ResourceType.CareTeam);

  public static async practitionerPatchData(index: number, roleCode: CareTeamRoleCode, resourceType: ResourceType, fhirId: string): Promise<JsonPatch[]> {
    const _role: CodeableConcept = await FhirResource.codeableConceptBuilder(CodingSystem.CareTeamRoles, roleCode);
    return [{
      op: JsonPatchOperation.ADD,
      path: `/participant/${index}`,
      value: [{
        role: [_role],
        member: FhirResource.referenceBuilder(resourceType, fhirId)
      }]
    }];
  }

  /**
   * Returns CareTeams, where user by given Id is the participant
   * @param uid user identifier
   * @return array of care teams
   */
  public findAll(uid: string): Promise<CareTeam[]> {
    return getFhirResourceId(uid)
      .then((data) => this.fhirResource.search<BundleResponse<CareTeam>>(`participant=${data.resourceType}/${data.fhirId}`))
      .then((response: BundleResponse<CareTeam>) => {
        return response.entry;
      })
      .then((entries: BundleEntry<CareTeam>[]) => entries && entries.length ? entries.map((entry: BundleEntry<CareTeam>) => entry.resource) : []);
  }

  /**
   * Checks that both users are in the same CareTeam
   * @param uid - first user identifier
   * @param nextUid -next user identifier
   * @return are in the same care team
   */
  public async sameCareTeam(uid: string, nextUid: string): Promise<boolean> {
    const careTeams: string[] = await this.findAll(uid).then((teams: CareTeam[]) => teams.map((team: CareTeam) => team.id));
    const nextCareTeams: string[] = await this.findAll(nextUid).then((teams: CareTeam[]) => teams.map((team: CareTeam) => team.id));
    return intersection(careTeams, nextCareTeams).length > 0;
  }

  public getCareTeamByPatient(uid: string, patientId: string): Promise<CareTeam> {
    return this.sameCareTeam(uid, patientId)
      .then((same: boolean) => same ? null : Promise.reject(new CustomError(ErrorCode.METHOD_NOT_ALLOWED, 'Only same care tem member can access care team data')))
      .then(() => FhirResource.getFhirResourceId(patientId))
      .then((fhirResourceId: FhirResourceId) => fhirResourceId.fhirId)
      .then((fhirId: string) => this.findByPatient(fhirId));
  }

  public getCareTeamByResourceWithMembers(uid: string, careTeamMemberId: string, resourceType: ResourceType, filter = true): Promise<CareTeamResources[]> {
    return this.sameCareTeam(uid, careTeamMemberId)
      .then((same: boolean) => same ? null : Promise.reject(new CustomError(ErrorCode.METHOD_NOT_ALLOWED, 'Only same care tem member can access care team data')))
      .then(() => FhirResource.getFhirResourceId(careTeamMemberId))
      .then((fhirResourceId: FhirResourceId) => fhirResourceId.fhirId)
      .then((fhirId: string) => this.findByMemberWithParticipants(fhirId, resourceType, filter));
  }

  /**
   * Returns all members of given ResourceType from care teams, where user is participant
   * @param uid user identifier
   * @param memberResourceType ResourceType of users to find
   * @return array of resources
   */
  public async members<T>(uid: string, memberResourceType: ResourceType): Promise<T[]> {
    const resourceData = await getFhirResourceId(uid);
    return (resourceData.resourceType === ResourceType.Patient) ?
      this.patientCareTeamMembers(resourceData.fhirId, memberResourceType)
      : this.otherCareTeamMembers(resourceData, memberResourceType);
  }

  /**
   * Returns CareTeam created for Patient with given id
   * @param fhirId - patient id
   * @return CareTeam
   */
  public findByPatient(fhirId: string): Promise<CareTeam> {
    return this.fhirResource.search<BundleResponse<CareTeam>>(`subject=Patient/${fhirId}`)
      .then((response: BundleResponse<CareTeam>) => response.entry[0].resource);
  }

  /**
   * Returns CareTeam created for Patient with given id
   * @param fhirId - patient id
   * @param resourceType ResourceType
   * @return CareTeamResources
   */
  public findByMemberWithParticipants(fhirId: string, resourceType: ResourceType, filter = true): Promise<CareTeamResources[]> {
    const searchQuery: string = resourceType === ResourceType.Patient ?
      `subject=Patient/${fhirId}&_include=CareTeam:participant`
      : `participant=${resourceType}/${fhirId}&_include=CareTeam:participant`;

    return this.fhirResource.search<BundleResponse<CareTeam>>(searchQuery)
      .then((response: BundleResponse<CareTeam | RelatedPerson | Practitioner>) => response.entry)
      .then((entries: BundleEntry<CareTeamResources>[]) => entries.map((entry: BundleEntry<CareTeamResources>) => entry.resource))
      .then((resources: CareTeamResources[]) => {
        return filter ?
          resources.filter((resource: CareTeamResources) => resource.resourceType !== ResourceType.CareTeam)
          : resources;
      });
  }

  /**
   * Appends participant with given resources to patient's CareTeam
   * @param patientId
   * @param fhirResourceId
   */
  public appendParticipant(patientId: string, fhirResourceId: FhirResourceId): Promise<CareTeam> {
    return this.findByPatient(patientId)
      .then((careTeam: CareTeam) => Promise.all([careTeam, this.participantRole(fhirResourceId)]))
      .then(([careTeam, role]) => Promise.all([careTeam, FhirResource.codeableConceptBuilder(CodingSystem.CareTeamRoles, role)]))
      .then(([careTeam, _role]) => {
        const patchData: JsonPatch[] = [{
          op: JsonPatchOperation.ADD,
          path: `/participant/${careTeam.participant.length}`,
          value: [{
            role: [_role],
            member: FhirResource.referenceBuilder(fhirResourceId.resourceType, fhirResourceId.fhirId)
          }]
        }];
        return this.fhirResource.update<CareTeam>(careTeam.id, patchData);
      });
  }

  /**
   * Returns array of fhir ids of all participants, where user is participant also
   * @param resourceData
   */
  public userCareTeamParticipants(resourceData: FhirResourceId): Promise<string[]> {
    return this.fhirResource.search<BundleResponse<CareTeam>>(`_content=${resourceData.resourceType}/${resourceData.fhirId}`)
      .then((careTeamsBundle: BundleResponse<CareTeam>) => this.getParticipantsFrom(careTeamsBundle));
  }

  public async checkAllowed(uid: string, patientId: string): Promise<void> {
    const allowed: boolean = patientId === uid || await this.sameCareTeam(uid, patientId);
    if (!allowed) {
      throw new CustomError(ErrorCode.METHOD_NOT_ALLOWED, 'Only care team member can see observations');
    }
  }

  /**
   * Retrieves the care team member role base on resource type. In case of practitioner, qualification is also used
   * @param fhirResourceId Care team member Fhir resource id
   * @private
   * @return CareTeamRoleCode
   */
  private async participantRole(fhirResourceId: FhirResourceId): Promise<CareTeamRoleCode> {
    if (fhirResourceId.resourceType === ResourceType.RelatedPerson) {
      return CareTeamRoleCode.RELATED;
    }
    return new FhirPractitionerRoleResource()
      .getByPractitionerId(fhirResourceId.fhirId)
      .then((practitionerRole: PractitionerRole) => practitionerRole.code[0].coding[0].code as PractitionerRoleCode)
      .then((code: PractitionerRoleCode) => {
        switch (code) {
          case PractitionerRoleCode.PHY:
            return CareTeamRoleCode.PHYS;
          case PractitionerRoleCode.NRS:
            return CareTeamRoleCode.NURSE;
          case PractitionerRoleCode.PSY:
            return CareTeamRoleCode.PSY;
          case PractitionerRoleCode.THE:
            return CareTeamRoleCode.THERAP;
          default:
            return CareTeamRoleCode.OTHER;
        }
      });
  }

  private careTeamMembers(fhirId: string, resourceType: ResourceType) {
    return this.fhirResource.search(`_content=${resourceType}/${fhirId}`);
  }

  /**
   * Returns members of care time with given ResourceType
   * @param patientId Fhir resource id
   * @param resourceType searched resource type
   * @private
   */
  private patientCareTeamMembers<T>(patientId: string, resourceType: ResourceType): Promise<T[]> {
    return this.fhirResource.search<BundleResponse<CareTeam>>(`subject=${resourceType}/${patientId}`)
      .then((response: BundleResponse<CareTeam>) => response.entry[0].resource.participant
        .filter((participant: CareTeamParticipant) => participant.member.type === resourceType)
        .map((participant: CareTeamParticipant) => participant.member.reference.split('/')[1])
      ).then((fhirIds: string[]) => {
        const promises = fhirIds.map((fhirId: string) => new FhirResource(resourceType).read<T>(fhirId));
        return Promise.all(promises);
      });
  }

  private async otherCareTeamMembers<T>(resourceData: FhirResourceId, resourceType: ResourceType): Promise<T[]> {
    const careTeamsBundle: BundleResponse<CareTeam> = await this.fhirResource
      .search<BundleResponse<CareTeam>>(`_content=${resourceData.resourceType}/${resourceData.fhirId}`);
    if (careTeamsBundle.total === 0) {
      return [];
    }
    const fhirIds: string[] = flatten<CareTeamParticipant>(careTeamsBundle.entry
      .map<CareTeamParticipant[]>((entry) =>
        entry.resource.participant.filter((participant: CareTeamParticipant) => participant.member.type === resourceType)
      ))
      .map<string>((participant) => participant.member.reference.split('/')[1]);

    const promises = fhirIds.map((fhirId: string) => new FhirResource(resourceType).read<T>(fhirId));
    return Promise.all(promises);
  }

  private getParticipantsFrom(careTeamsBundle: BundleResponse<CareTeam>): string[] {
    return (careTeamsBundle.total === 0) ? [] : flatten<CareTeamParticipant>(careTeamsBundle.entry
      .map<CareTeamParticipant[]>((entry) => entry.resource.participant))
      .map<string>((participant) => participant.member.reference.split('/')[1]);
  }
}
