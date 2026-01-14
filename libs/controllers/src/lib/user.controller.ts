import {
  Attachment,
  AuthData,
  CareTeam,
  CareTeamParticipant,
  CareTeamRoleCode,
  CodeableConcept,
  CodingSystem,
  ContactPoint,
  ContactPointSystem,
  ContactPointUse,
  DBUser,
  FhirResourceId,
  Identifier,
  IdentifierCode,
  JsonPatch,
  JsonPatchOperation,
  NameUse,
  Patient,
  Person,
  Practitioner,
  PractitionerRole,
  PractitionerRoleCode,
  RelatedPerson,
  ResourceType,
  Role,
  TokenAction
} from '@signalbot-backend/interfaces';
import { SmsHelper } from '@signalbot-backend/sms-helper';
import { comparePassword, UserModel } from '@signalbot-backend/schemas';
import { JwtHelper } from '@signalbot-backend/jwt-helper';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import {
  FhirCareTeamResource,
  FhirPerson,
  FhirPractitionerRoleResource,
  FhirResource
} from '@signalbot-backend/fhir-connector';
import { conf } from '@conf';
import { getFhirResourceId, getUserResource, humanName } from '@signalbot-backend/user-resource';
import { CareTeamController } from './care-team.controller';

export class UserController {
  private smsHelper: SmsHelper = new SmsHelper();
  private practitionerRoleResource: FhirPractitionerRoleResource = new FhirPractitionerRoleResource();

  /**
   * Creates new user
   * @param authData base data to create user
   * @param resourceType type of fhir resource
   * @param relatedPersonId<string> Related Person id to be connected with patient
   * @return created user data
   */
  public async createUser(authData: AuthData, resourceType: ResourceType, relatedPersonId?: string): Promise<DBUser> {
    const role: Role = this.getRole(resourceType, authData.practitionerRole);
    const user: DBUser = new UserModel({ ...authData, roles: [role] });

    switch (resourceType) {
      case ResourceType.RelatedPerson:
        user.fhirId = await this.createRelatedPersonResource(authData, user._id);
        break;
      case ResourceType.Practitioner:
        user.fhirId = await this.createPractitionerResource(authData, user._id);
        break;
      case ResourceType.Patient:
        user.fhirId = await this.createPatientResource(authData, user._id, relatedPersonId);
        break;
    }

    return user.save();
  }

  /**
   * Creates user token base on DBUSer
   * @param user<DBUser>
   * @return created user token
   */
  public createUserToken(user: DBUser | null): string {
    if (user === null) {
      throw new CustomError(ErrorCode.USER_NOT_FOUND, 'User not found');
    }
    return JwtHelper.sign({data: { _id: user._id, roles: user.roles }, action: TokenAction.AUTH_TOKEN}, {expiresIn: conf.AUTH_TOKEN_LIFETIME});
  }

  /**
   * Sends SMS Authentication code for user with given uid
   * @param uid user identifier
   */
  public async sendAuthCode(uid: string): Promise<void> {
    return UserModel.findById(uid).then((user: DBUser | null) => this.smsHelper.sendAuthCode(user));
  }

  /**
   * Change confirmed property
   * @param uid user identifier to be confirmed
   * @param code SMS auth code
   */
  public async confirmPhoneNumber(uid: string, code: string): Promise<void> {
    return UserModel.findById(uid)
      .then((user: DBUser) => this.smsHelper.checkAuthCode(user, code))
      .then(() => UserModel.findByIdAndUpdate(uid, { confirmed: true }))
      .then(() => void 0);
  }

  /**
   * Search user by FhirID reference
   * @param ref Reference
   */
  public searchByRef(ref: string): Promise<DBUser> {
    return UserModel
      .findOne({ fhirId: ref.split('/')[1] })
      .exec()
      .then((user: DBUser | null) => user === null ? Promise.reject(new CustomError(ErrorCode.RESOURCES_NOT_FOUND)) : user);
  }

  /**
   * Updates user property
   * @param uid user mongo identifier
   * @param property property name
   * @param value property value
   * @return Updated user
   */
  public async updateProperty<T>(uid: string, property: string, value: unknown): Promise<T> {
    const jsonPatchMap: { [key: string]: JsonPatch } = {
      gender: { op: JsonPatchOperation.REPLACE, path: '/gender', value },
      firstName: { op: JsonPatchOperation.REPLACE, path: '/name/0/given/0', value: [value] },
      lastName: { op: JsonPatchOperation.REPLACE, path: '/name/0/family', value },
      addressLine: { op: JsonPatchOperation.ADD, path: '/address/0/line', value: value },
      postalCode: { op: JsonPatchOperation.ADD, path: '/address/0/postalCode', value },
      city: { op: JsonPatchOperation.ADD, path: '/address/0/city', value },
      photo: { op: JsonPatchOperation.ADD, path: '/photo', value: [value] },
      pesel: {
        op: JsonPatchOperation.REPLACE,
        path: `/identifier${await this.getIdentifierIndex(uid, IdentifierCode.PESEL)}/value`,
        value
      }
    };
    switch (property) {
      case 'pwz':
        return this.patchPWZ<T>(uid, value as string);
      case 'academicTitle':
        return this.patchAcademicTitle<T>(uid, value as string);
      case 'email':
        return this.patchEmail<T>(uid, value as string);
      case 'specialty':
        return this.patchSpeciality<T>(uid, value);
      default:
        return getFhirResourceId(uid).then((fhirResourceId: FhirResourceId) =>
          new FhirResource(fhirResourceId.resourceType).update<T>(fhirResourceId.fhirId, [jsonPatchMap[property]])
        );
    }
  }

  /**
   * Return Attachment with avatar for user with given id
   * @param uid user identifier
   * @return Attachment
   */
  public getAvatar(uid: string): Promise<Attachment> {
    return getFhirResourceId(uid)
      .then((fhirResourceId: FhirResourceId) => getUserResource(fhirResourceId.fhirId, fhirResourceId.resourceType))
      .then((resource: RelatedPerson | Practitioner | Patient) => resource.photo)
      .then((attachments: Attachment[]) => {
        if (attachments === undefined || attachments.length === 0) {
          throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, 'Missing user photo');
        }
        return attachments[0];
      });
  }

  /**
   * Changes password for the logged-in user
   * @param uid user identifier
   * @param oldPassword old password
   * @param password new password
   */
  public async changePassword(uid: string, oldPassword: string, password: string): Promise<void> {
    const user: DBUser = await UserModel.findById(uid).then((user: DBUser) => {
      if (comparePassword(user, oldPassword)) return user;
      else throw new CustomError(ErrorCode.INVALID_CREDENTIALS);
    });
    user.password = password;
    return user.save().then(() => void 0);
  }

  private async patchSpeciality<T>(uid: string, code: unknown): Promise<T> {
    const fhirResourceId: FhirResourceId = await getFhirResourceId(uid);

    return new FhirPractitionerRoleResource().getByPractitionerId(fhirResourceId.fhirId)
      .then((practitionerRole: PractitionerRole) => Promise.all([practitionerRole, FhirResource.codeableConceptBuilder(CodingSystem.MedicalSpecialization, code)]))
      .then(([practitionerRole, specialityCode]) => {
        return {
          op: practitionerRole.specialty ? JsonPatchOperation.REPLACE : JsonPatchOperation.ADD,
          path: practitionerRole.specialty ? '/specialty/0' : '/specialty',
          value: [specialityCode]
        };
      })
      .then((patch: JsonPatch) => {
        return patch;
      })
      .then((jsonPatch: JsonPatch) => new FhirPractitionerRoleResource().updateByPractitionerId(fhirResourceId.fhirId, jsonPatch))
      .then((practitionerRole: PractitionerRole) => (practitionerRole as unknown) as T);
  }

  public userHumanName(uid: string, userId: string): Promise<{ firstName: string, lastName: string }> {
    return new CareTeamController().checkAllowed(uid, userId)
      .then(() => FhirResource.getFhirResourceId(userId))
      .then((fhirRes: FhirResourceId) => getUserResource(fhirRes.fhirId, fhirRes.resourceType))
      .then((person: Person) => humanName(person));
  }

  public getLastLogin(uid: string): Promise<string> {
    return UserModel.findById(uid, { lastLogin: 1 }).then((user: DBUser) => user.lastLogin);
  }

  private async patchEmail<T>(uid: string, email: string): Promise<T> {
    const fhirResourceId: FhirResourceId = await getFhirResourceId(uid);
    const index: number = await getUserResource<T>(fhirResourceId.fhirId, fhirResourceId.resourceType)
      .then((person: T) => (person as unknown))
      .then((person: unknown) => (person as Person).telecom)
      .then((contactPoints: ContactPoint[]) => contactPoints.findIndex((cp: ContactPoint) => cp.system === ContactPointSystem.email));

    const jsonPatch: JsonPatch[] = [
      {
        op: JsonPatchOperation.REPLACE,
        path: `/telecom/${index}/value`,
        value: email
      }
    ];

    return UserModel.findByIdAndUpdate(uid, { email })
      .then(() => new FhirResource(fhirResourceId.resourceType).update<T>(fhirResourceId.fhirId, jsonPatch));
  }

  private patchPWZ<T>(uid: string, value: string): Promise<T> {
    const jsonPatch: JsonPatch = {
      op: JsonPatchOperation.REPLACE,
      path: '/identifier/0/value',
      value
    };

    return getFhirResourceId(uid)
      .then((fhirResourceId: FhirResourceId) =>
        Promise.all([fhirResourceId, this.practitionerRoleResource.updateByPractitionerId(fhirResourceId.fhirId, jsonPatch)])
      )
      .then(([fhirResourceId]) => getUserResource<T>(fhirResourceId.fhirId, fhirResourceId.resourceType));
  }

  private async patchAcademicTitle<T>(uid: string, value: string): Promise<T> {
    const jsonPatch: JsonPatch[] = [
      {
        op: JsonPatchOperation.REPLACE,
        path: `/qualification/0/code`,
        value: await FhirResource.codeableConceptBuilder(CodingSystem.AcademicTitles, value)
      }
    ];
    return getFhirResourceId(uid).then((fhirResourceId: FhirResourceId) =>
      new FhirResource(fhirResourceId.resourceType).update<T>(fhirResourceId.fhirId, jsonPatch)
    );
  }

  private getIdentifierIndex(uid: string, identifierCode: IdentifierCode): Promise<string> {
    return getFhirResourceId(uid)
      .then((fhirResourceId: FhirResourceId) => getUserResource<Person>(fhirResourceId.fhirId, fhirResourceId.resourceType))
      .then((person: Person) => person.identifier)
      .then((identifiers: Identifier[]) => identifiers.findIndex((identifier: Identifier) => identifier.type.coding[0].code === identifierCode))
      .then((index: number) => index !== -1 ? `/${index}` : '');
  }

  private async createPatientResource(authData: AuthData, uid: string, relatedPersonId?: string): Promise<string> {
    const person: FhirPerson = this.createPerson(authData, ResourceType.Patient);
    await person.setIdentifier(CodingSystem.IdentifierType, IdentifierCode.MONGO, uid);
    await person.setIdentifier(CodingSystem.IdentifierType, IdentifierCode.PESEL, authData.identifier);

    if (relatedPersonId === undefined) {
      const contactPoints: ContactPoint[] = [
        {
          system: ContactPointSystem.phone,
          value: authData.phoneNumber,
          use: ContactPointUse.mobile
        }
      ];

      if (authData.email) {
        contactPoints.push({
          system: ContactPointSystem.email,
          value: authData.email,
          use: ContactPointUse.home
        });
      }
      person.setContactPoint(contactPoints);
    }

    const resourceId: string | void = await new FhirResource(ResourceType.Patient)
      .create<Patient>(person.getResource<Patient>())
      .then((resource: Patient) => resource.id || '');

    const careTeam: CareTeam = await FhirCareTeamResource.build(
      { family: authData.lastName, given: [authData.firstName], use: NameUse.official },
      resourceId || ''
    );

    if (relatedPersonId) {
      const relatedRole: CodeableConcept = await FhirResource.codeableConceptBuilder(CodingSystem.CareTeamRoles, CareTeamRoleCode.RELATED);
      const careTeamParticipant: CareTeamParticipant = {
        role: [relatedRole],
        member: FhirResource.referenceBuilder(ResourceType.RelatedPerson, relatedPersonId)
      };
      careTeam.participant.push(careTeamParticipant);
    }

    return new FhirCareTeamResource().create<CareTeam>(careTeam).then(() => resourceId || '');
  }

  private async createPractitionerResource(authData: AuthData, uid: string): Promise<string> {
    const person: FhirPerson = this.createPerson(authData, ResourceType.Practitioner);
    await person.setIdentifier(CodingSystem.IdentifierType, IdentifierCode.MONGO, uid);

    const contactPoints: ContactPoint[] = [
      {
        system: ContactPointSystem.phone,
        value: authData.phoneNumber,
        use: ContactPointUse.mobile
      },
      {
        system: ContactPointSystem.email,
        value: authData.email,
        use: ContactPointUse.home
      }
    ];
    person.setContactPoint(contactPoints);

    const practitioner: Practitioner = person.getResource<Practitioner>();
    practitioner.qualification = {
      code: await FhirResource.codeableConceptBuilder(CodingSystem.AcademicTitles, authData.academicTitle)
    };

    return new FhirResource(ResourceType.Practitioner).create<Practitioner>(practitioner)
      .then((resource: Practitioner) => new FhirPractitionerRoleResource().create(resource.id, authData.identifier, authData.practitionerRole))
      .then((practitionerRole: PractitionerRole) => practitionerRole.practitioner.reference.split('/')[1]);
  }

  private async createRelatedPersonResource(authData: AuthData, uid: string): Promise<string> {
    const person: FhirPerson = this.createPerson(authData, ResourceType.RelatedPerson);
    await person.setIdentifier(CodingSystem.IdentifierType, IdentifierCode.MONGO, uid);
    const contactPoints: ContactPoint[] = [
      {
        system: ContactPointSystem.phone,
        value: authData.phoneNumber,
        use: ContactPointUse.mobile
      },
      {
        system: ContactPointSystem.email,
        value: authData.email,
        use: ContactPointUse.home
      }
    ];
    person.setContactPoint(contactPoints);
    return new FhirResource(ResourceType.RelatedPerson).create<RelatedPerson>(person.getResource<RelatedPerson>())
      .then((resource: RelatedPerson) => resource.id || '');
  }

  private createPerson(authData: AuthData, resourceType: ResourceType): FhirPerson {
    const person: FhirPerson = new FhirPerson(resourceType);
    person.setName(authData.lastName, [authData.firstName]);
    return person;
  }

  private getRole(resourceType: ResourceType, practitionerRoleCode: PractitionerRoleCode): Role {
    const ROLES: { [key: string]: string } = {
      [ResourceType.Practitioner]: Role.physician,
      [ResourceType.RelatedPerson]: Role.relatedPerson,
      [ResourceType.Patient]: Role.patient
    };
    const PHYS_ROLES = {
      [PractitionerRoleCode.PHY]: Role.physician,
      [PractitionerRoleCode.NRS]: Role.nurse,
      [PractitionerRoleCode.OTH]: Role.therapist,
      [PractitionerRoleCode.PSY]: Role.therapist,
      [PractitionerRoleCode.THE]: Role.therapist
    };
    if (resourceType === ResourceType.Practitioner && practitionerRoleCode !== undefined) {
      return PHYS_ROLES[practitionerRoleCode];
    } else {
      return ROLES[resourceType] as Role;
    }
  }
}
