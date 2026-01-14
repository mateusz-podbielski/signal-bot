import { FhirResource } from './fhir-resource';
import {
  BundleResponse,
  CodingSystem,
  Identifier,
  IdentifierCode,
  IdentifierUse,
  JsonPatch,
  PractitionerRole,
  PractitionerRoleCode,
  ResourceType
} from '@signalbot-backend/interfaces';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';

export class FhirPractitionerRoleResource {
  private practitionerRoleResource: FhirResource = new FhirResource(ResourceType.PractitionerRole);

  /**
   * Creates base PractitionerRole resource
   * @param practitionerId - practitioner.router fhir Id
   * @param pwz
   * @param roleCode PractitionerRoleCode
   */
  public async create(practitionerId: string, pwz: string, roleCode: PractitionerRoleCode): Promise<PractitionerRole> {
    const pwzIdentifier: Identifier = {
      system: CodingSystem.IdentifierType,
      value: pwz,
      type: await FhirResource.codeableConceptBuilder(CodingSystem.IdentifierType, IdentifierCode.MD),
      use: IdentifierUse.official
    };

    return this.practitionerRoleResource.create<PractitionerRole>({
      resourceType: ResourceType.PractitionerRole,
      practitioner: FhirResource.referenceBuilder(ResourceType.Practitioner, practitionerId),
      identifier: [pwzIdentifier],
      code: [await FhirResource.codeableConceptBuilder(CodingSystem.PractitionerRole, roleCode)],
    });
  }

  /**
   * Returns PractitionerRole resource found by given practitioner.router Id
   * @param fhirId
   * @return PractitionerRole
   */
  public getByPractitionerId(fhirId: string): Promise<PractitionerRole> {
    return this.practitionerRoleResource.search<BundleResponse<PractitionerRole>>(`practitioner=Practitioner/${fhirId}`)
      .then((bundle: BundleResponse<PractitionerRole>) => {
        if (bundle.total === 0) {
          throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, 'PractitionerRole resource not found');
        }
        return bundle.entry[0].resource;
      });
  }

  public updateByPractitionerId(fhirId: string, patchData: JsonPatch): Promise<PractitionerRole> {
    return this.getByPractitionerId(fhirId).then((practitionerRole: PractitionerRole) => practitionerRole.id)
      .then((id: string) => this.practitionerRoleResource.update<PractitionerRole>(id, [patchData]));
  }
}
