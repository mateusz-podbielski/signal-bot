import { UserController } from './user.controller';
import {
  AuthData,
  CodeableConcept,
  CodingSystem,
  DBUser, ExtensionUrl,
  FamilyRelation, FhirResourceId,
  JsonPatch,
  JsonPatchOperation,
  RelatedPerson,
  ResourceType
} from '@signalbot-backend/interfaces';
import { FhirResource } from '@signalbot-backend/fhir-connector';
import { getFhirResourceId } from '@signalbot-backend/user-resource';
import { extensionIndex } from './controller-tools';

export class RelatedPersonController {
  private userController: UserController;

  constructor() {
    this.userController = new UserController();
  }

  /**
   * Add child (Patient) to fhir and connect with related person
   * @param childData Patient data to create account and connect with related person
   * @param relatedPersonId
   */
  public async addChild(childData: Partial<AuthData>, relatedPersonId: string): Promise<string> {
    const relatedPersonFhirResourceId: { fhirId: string, resourceType: ResourceType } = await getFhirResourceId(relatedPersonId);

    return this.userController.createUser({ ...childData } as AuthData, ResourceType.Patient, relatedPersonFhirResourceId.fhirId)
      .then((user: DBUser) => {
        return this.appendPatient(relatedPersonFhirResourceId.fhirId, user.fhirId, childData.familyRelation)
          .then(() => user._id);
      });
  }

  /**
   * Appends patient to related person
   * @param id RelatedPerson Fhir resource id
   * @param patientId Patient Fhir resource id
   * @param familyRelation the type of family relation (enum)
   */
  public appendPatient(id: string, patientId: string, familyRelation: FamilyRelation): Promise<RelatedPerson> {
    return FhirResource.codeableConceptBuilder(CodingSystem.FamilyRelations, familyRelation)
      .then((code: CodeableConcept) => {
        const patchData: JsonPatch[] = [
          {
            op: JsonPatchOperation.ADD,
            path: '/patient',
            value: {
              type: ResourceType.Patient,
              reference: `/Patient/${patientId}`
            }
          },
          {
            op: JsonPatchOperation.ADD,
            path: '/extension',
            value: [{
              url: ExtensionUrl.familyRelation,
              valueCodeableConcept: code
            }]
          }
        ];
        return new FhirResource(ResourceType.RelatedPerson).update(id, patchData);
      });
  }

  public async changePatientRelation(uid: string, familyRelation: FamilyRelation): Promise<RelatedPerson> {
    const fhirResourceId: FhirResourceId = await getFhirResourceId(uid);
    const idx: number = await extensionIndex(ResourceType.RelatedPerson, fhirResourceId.fhirId, ExtensionUrl.familyRelation);

    return FhirResource.codeableConceptBuilder(CodingSystem.FamilyRelations, familyRelation)
      .then((code: CodeableConcept) => {
        const patchData: JsonPatch[] = [
          {
            op: JsonPatchOperation.REPLACE,
            path: `/extension/${idx}`,
            value: [{
              url: ExtensionUrl.familyRelation,
              valueCodeableConcept: code
            }]
          }
        ];
        return new FhirResource(ResourceType.RelatedPerson).update(fhirResourceId.fhirId, patchData);
      });
  }
}
