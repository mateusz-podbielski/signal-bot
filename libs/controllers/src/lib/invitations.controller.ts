import { stringify } from 'querystring';
import { Types } from 'mongoose';
import {
  DBInvitation,
  DBUser,
  FhirResourceId,
  HumanName,
  Invitation,
  InvitationState,
  NameUse,
  Person,
  ResourceType,
  TokenAction,
  TokenData
} from '@signalbot-backend/interfaces';
import { BitlyHelper, TokenGenerator } from '@signalbot-backend/jwt-helper';
import { Token, UserModel } from '@signalbot-backend/schemas';
import { SmsHelper } from '@signalbot-backend/sms-helper';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { conf } from '@conf';
import { logger, logLevels } from '@signalbot-backend/logger';
import { getFhirResourceId, getUserResource } from '@signalbot-backend/user-resource';
import { CareTeamController } from './care-team.controller';
import { AppMessageController } from './app-message.controller';
import i18next from 'i18next';

export class InvitationsController {
  private tokenGenerator: TokenGenerator = new TokenGenerator();
  private careTeamController: CareTeamController = new CareTeamController();
  private appMessageController: AppMessageController = new AppMessageController();
  private smsHelper: SmsHelper = new SmsHelper();

  constructor() {
    i18next.init({
      ns: 'messages',
    });
  }
  /**
   * Accepts invitation
   * @param uid
   * @param invitationId
   */
  public async acceptInvitation(uid: string, invitationId: string): Promise<void> {
    const invitation: Invitation = await UserModel.findById(uid, { invitations: 1 })
      .then((user: DBUser) => user.invitations.id(invitationId));
    const sender: FhirResourceId = invitation.patientId ? {
      resourceType: ResourceType.Patient,
      fhirId: invitation.patientId
    } : await getFhirResourceId(invitation.uid.toString());
    const recipient: FhirResourceId = await UserModel.findOne({ phoneNumber: invitation.phoneNumber }, { _id: 1 })
      .then((user: DBUser) => getFhirResourceId(user._id));
    const data: { patient: FhirResourceId, other: FhirResourceId } = InvitationsController.selectPatient(sender, recipient);
    return this.careTeamController.appendParticipant(data.patient.fhirId, data.other).then(() => void 0)
      .then(() => this.deleteAfterAccept(uid, invitationId));
  }

  /**
   * Accept invitation from SMS
   * @param uid
   * @param invitation
   */
  public async acceptSMSInvitation(uid: string, invitation: Invitation): Promise<void> {
    const sender: FhirResourceId = await getFhirResourceId(invitation.uid.toString());
    const recipient: FhirResourceId = await getFhirResourceId(uid);
    const data: { patient: FhirResourceId, other: FhirResourceId } = InvitationsController.selectPatient(sender, recipient);
    return this.careTeamController.appendParticipant(data.patient.fhirId, data.other).then(() => void 0)
      .then(() => this.deleteInvitation(invitation.uid.toString(), invitation._id));
  }

  /**
   * Rejects the invitation
   * @param uid
   * @param invitationId
   * @return invitations array
   */
  public async rejectInvitation(uid: string, invitationId: string): Promise<Invitation[]> {
    // TODO: fix rejecting the invitation
    return UserModel.findById(uid).then((user: DBUser) => user.invitations);
  }

  /**
   * Common handler for sending the invitation to new or existing user
   * @param uid
   * @param phoneNumber
   * @param resourceType
   * @param patientId
   * @return created invitation
   */
  public async inviteMember(uid: string, phoneNumber: string, resourceType: ResourceType, patientId?: string): Promise<Invitation[]> {
    const invitedUser: DBUser = await UserModel.findOne({ phoneNumber });

    if (invitedUser !== null && invitedUser._id.toString() === uid) {
      throw new CustomError(ErrorCode.METHOD_NOT_ALLOWED);
    }

    const personResource: Person = await getFhirResourceId(uid)
      .then((fhirResourceId: FhirResourceId) => getUserResource(fhirResourceId.fhirId, fhirResourceId.resourceType));
    const name: HumanName = personResource.name.find((n: HumanName) => n.use === NameUse.official);
    const invitation: Invitation = {
      uid: new Types.ObjectId(uid),
      phoneNumber,
      resourceType,
      state: InvitationState.ACTIVE,
      firstName: name.given[0],
      lastName: name.family,
      patientId
    };

    const invitationResult: Promise<void> = invitedUser === null ? this.inviteNewMember(invitation)
      : this.inviteExistingMember(invitation, invitedUser._id);

    // saves invitation to invitation sender's profile.
    return invitationResult.then(() => UserModel.findById(uid))
      .then((user: DBUser) => {
        user.invitations.push(invitation);
        return user.save();
      }).then((user: DBUser) => user.invitations);
  }

  /**
   * Fetch all user invitations
   * @param uid user identifier
   * @return array of user invitations
   */
  public fetchInvitations(uid: string): Promise<Invitation[]> {
    return UserModel.findById(uid, { invitations: 1 }).then((user: Partial<DBUser>) => user.invitations);
  }

  /**
   * Deletes invitation and connected token.
   * @param uid user identifier
   * @param invitationId id of invitation to delete
   */
  public deleteInvitation(uid: string, invitationId: string): Promise<void> {
    return UserModel.findById(uid)
      .then((user: DBUser) => {
        const invitation: DBInvitation = user.invitations.id(invitationId);
        return Token.findByIdAndRemove(invitation.tokenId);
      })
      .then(() => this.removeInvitation(uid, invitationId))
      .then(() => void 0);
  }

  /**
   * Deletes used invitation
   * @param uid
   * @param invitationId
   */
  public async deleteAfterAccept(uid: string, invitationId: string): Promise<void> {
    const invitation: Invitation = await UserModel.findById(uid, { invitations: 1 })
      .then((user: DBUser) => user.invitations.id(invitationId));
    return this.removeOtherInvitation(invitation)
      .then(() => this.removeInvitation(uid, invitationId))
      .then(() => void 0);
  }

  private saveInvitationRejectMessage(uid: string, invitationUid: Types.ObjectId): Promise<void> {
    return getFhirResourceId(uid)
      .then((fhirResourceId: FhirResourceId) => getUserResource<Person>(fhirResourceId.fhirId, fhirResourceId.resourceType))
      .then((person: Person) => person.name.find((n: HumanName) => n.use === NameUse.official))
      .then((name: HumanName) => this.appMessageController.create(
        i18next.t('inviteRejectAppMessage', {
          firstName: name.given[0],
          lastName: name.family
        }),
        uid,
        invitationUid
      ));
  }

  /**
   * Removes other invitation at the end of acceptance process
   * @param invitation
   * @private
   */
  private removeOtherInvitation(invitation: Invitation): Promise<void> {
    return UserModel.aggregate([
      { $match: { _id: new Types.ObjectId(invitation.uid) } },
      { $unwind: '$invitations' },
      { $match: { 'invitations.phoneNumber': invitation.phoneNumber } },
      { $project: { 'invitationId': '$invitations._id', '_id': 0 } }
    ])
      .then((aggregationResult: { invitationId: string }[]) => aggregationResult[0].invitationId)
      .then((senderInvitationId: string) => this.removeInvitation(invitation.uid.toString(), senderInvitationId))
      .then(() => void 0);
  }

  private async validateInvitation(fhirResourceId: FhirResourceId, invitingUserFhirId: string): Promise<boolean> {
    const ids: string[] = await this.careTeamController.userCareTeamParticipants(fhirResourceId);
    return ids.includes(invitingUserFhirId);
  }

  /**
   * Sends invitation to Existing user by saving the Invitation object and sending AppMessage
   * @param invitation
   * @param invitedUid
   * @private
   */
  private async inviteExistingMember(invitation: Invitation, invitedUid: string): Promise<void> {
    const user: DBUser = await UserModel.findById(invitedUid);
    const invitationSender: FhirResourceId = await getFhirResourceId(invitation.uid.toString());
    const fhirResourceId: FhirResourceId = await getFhirResourceId(invitedUid);

    if (fhirResourceId.resourceType !== invitation.resourceType) {
      const errorData: unknown = {
        phoneNumber: invitation.phoneNumber,
        resourceType: {
          current: fhirResourceId.resourceType,
          requested: invitation.resourceType
        }
      };
      throw new CustomError(ErrorCode.DATA_CONFLICT, 'Requested Resource type conflicts with current user Resource Type', errorData);
    }

    if (await this.validateInvitation(fhirResourceId, invitationSender.fhirId)) {
      throw new CustomError(ErrorCode.OPERATION_CAN_NOT_BE_PERFORMED, 'User already in care team');
    }
    user.invitations.push(invitation);
    return user.save()
      .then(() => {
        const message: string = i18next.t('inviteAppMessage', {
          firstName: invitation.firstName,
          lastName: invitation.lastName
        });
        return this.appMessageController.create(message, invitedUid, invitation.uid);
      });
  }

  /**
   * Sends invitation to application for new user
   * @param invitation - prepared invitation object
   * @param uid identifier of user who's inviting
   */
  private async inviteNewMember(invitation: Invitation): Promise<void> {
    this.tokenGenerator.generate(invitation as unknown as Record<string, unknown>, TokenAction.INVITE_MEMBER, conf.INVITE_TOKEN_LIFETIME)
      .then((tokenData: TokenData) => {
        invitation.tokenId = tokenData.id;
        return `${process.env.BACKEND_URL}/action?${stringify({
          id: tokenData.id,
          token: tokenData.token
        })}`;
      })
      .then((longUrl: string) => new BitlyHelper().shorten(longUrl))
      .then((link: string) => {
        logger.log(logLevels.info, link);
        const message: string = i18next.t('inviteSMS', {
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          link
        });
        return this.smsHelper.sendSMS(invitation.phoneNumber, message);
      });
  }

  private async removeInvitation(uid: string, invitationId: string): Promise<DBUser> {
    const user: DBUser = await UserModel.findById(uid);
    if (user === null) {
      throw new CustomError(ErrorCode.USER_NOT_FOUND);
    }
    await user.invitations.id(invitationId).remove();
    return user.save();
  }

  private static selectPatient(sender, recipient): { patient: FhirResourceId, other: FhirResourceId } {
    const patient: FhirResourceId = sender.resourceType === ResourceType.Patient ? sender : recipient;
    const other: FhirResourceId = sender.resourceType === ResourceType.Patient ? recipient : sender;
    return { patient, other };
  }
}
