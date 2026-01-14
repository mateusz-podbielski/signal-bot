import { FhirResource } from '@signalbot-backend/fhir-connector';
import {
  ContactPoint,
  ContactPointSystem,
  DBUser,
  FhirResourceId,
  Person,
  ResourceType
} from '@signalbot-backend/interfaces';
import { UserModel } from '@signalbot-backend/schemas';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { rolesMap } from '@signalbot-backend/roles-map';

/**
 * Get fhir resource from Fhir App
 * @param fhirId
 * @param resourceType
 */
export function getUserResource<T>(fhirId: string, resourceType: ResourceType): Promise<T> {
  const fhirResource: FhirResource = new FhirResource(resourceType);
  return fhirResource.read<T>(fhirId);
}

/**
 * Returns User Fhir resource id and its ResourceType
 * @param uid
 * @return resource id and type
 */
export function getFhirResourceId(uid: string): Promise<FhirResourceId> {
  return UserModel
    .findById(uid, { fhirId: 1, roles: 1 })
    .then((user: DBUser | null) => {
      if (user === null || user.fhirId === undefined) {
        throw new CustomError(ErrorCode.USER_NOT_FOUND);
      }
      return {
        fhirId: user.fhirId,
        resourceType: rolesMap[user.roles[0]] || ResourceType.Person
      };
    });
}

/**
 * Returns base user data
 * @param uid
 * @return Fhir resource
 */
export function getUserData(uid: string): Promise<Person> {
  return getFhirResourceId(uid)
    .then((data: { fhirId: string, resourceType: ResourceType }) => getUserResource(data.fhirId, data.resourceType));
}

/**
 * Extracts firstName and lastName from Person
 * @param person
 */
export function humanName(person: Person): { firstName: string, lastName: string } {
  return { firstName: person.name[0].given.join(' '), lastName: person.name[0].family };
}

export function personEmail(person: Person): string {
  return person.telecom.find((contactPoint: ContactPoint) => contactPoint.system === ContactPointSystem.email).value;
}
