import * as bcrypt from 'bcryptjs';
import {
  AuthData,
  DBUser,
  HumanName, Invitation,
  NameUse,
  Person,
  ResourceType,
  TokenAction,
  TokenData,
  TokenPayload,
  UserModelInterface,
  UserPhone
} from '@signalbot-backend/interfaces';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { SmsHelper } from '@signalbot-backend/sms-helper';
import { TokenGenerator } from '@signalbot-backend/jwt-helper';
import { Mailer } from '@signalbot-backend/mailer';
import { UserModel } from '@signalbot-backend/schemas';
import { logger, logLevels } from '@signalbot-backend/logger';
import { getFhirResourceId, getUserResource } from '@signalbot-backend/user-resource';
import { InvitationsController } from './invitations.controller';
import { UserController } from './user.controller';
import { DateTime } from 'luxon';
import { assert } from './controller-tools';

export class AuthController {
  private controller: UserController;
  private smsHelper: SmsHelper;
  private tokenGenerator: TokenGenerator;
  private invitationsController: InvitationsController = new InvitationsController();

  constructor() {
    this.controller = new UserController();
    this.smsHelper = new SmsHelper();
    this.tokenGenerator = new TokenGenerator();
  }

  /**
   * Confirms phone number for new user. The part of registration process
   * @param phoneNumber
   * @param code
   */
  public confirmPhoneNumber(phoneNumber: string, code: string): Promise<void> {
    return UserModel.findOne({ phoneNumber })
      .then((user: DBUser) => this.controller.confirmPhoneNumber(user._id.toString(), code));
  }

  public async sendAuthCode(phoneNumber: string): Promise<void> {
    return UserModel.findOne({ phoneNumber }).then((user: DBUser | null) => this.smsHelper.sendAuthCode(user));
  }

  /**
   * Crates new user
   * @param authData data to create user
   * @param resourceType resource type of created user
   * @return token
   */
  public async createUser(authData: AuthData, resourceType: ResourceType): Promise<{ token: string; uid: string }> {
    return this.createUserHandler(authData, resourceType);
  }

  /**
   * Creates new user base on token
   * @param authData data to create new user
   * @param token the action token with invitation
   * @param id action token id
   */
  public async createInvitedUser(authData: AuthData, token: string, id: string): Promise<{ token: string; uid: string }> {
    const invitation: Invitation = await this.tokenGenerator.checkToken({ token, id })
      .then((decoded: TokenPayload) => assert<Invitation>(decoded.data));
    const userData: { token: string; uid: string } = await this.createUserHandler(authData, invitation.resourceType);
    return this.invitationsController.acceptSMSInvitation(userData.uid, invitation).then(() => {
      return userData;
    });
  }

  /**
   * Authenticate user by password
   * @param phoneNumber
   * @param password
   * @return token
   */
  public authenticate(phoneNumber: string, password: string): Promise<string> {
    return (UserModel as UserModelInterface)
      .authenticate(phoneNumber, password)
      .then((user: DBUser) => Promise.all([this.controller.createUserToken(user), this.saveLastLogin(user._id)]))
      .then(([token]: [string, DBUser]) => token);
  }

  /**
   * Starts password change process
   * @param phoneNumber
   * @return action token
   */
  public async restorePassword(phoneNumber: string): Promise<TokenData> {
    const user: DBUser | null = await UserModel.findOne({ phoneNumber });
    if (user === null) {
      throw new CustomError(ErrorCode.USER_NOT_FOUND, 'Provided phone number does not exist');
    }
    if (!user.confirmed) {
      throw new CustomError(ErrorCode.USER_NOT_CONFIRMED, 'User not confirmed');
    }
    return this.smsHelper.sendAuthCode(user).then(() =>
      this.tokenGenerator.generate({ phoneNumber, uid: user._id }, TokenAction.CHANGE_PASSWORD, '48h')
    );
  }

  /**
   * Changes password for user with given phone number
   * @param phoneNumber
   * @param tokenData
   * @param password
   * @param code
   * @return token authentication token
   */
  public async changePassword(phoneNumber: string, tokenData: TokenData, password: string, code: string): Promise<string> {
    return this.checkPasswordChangeToken(phoneNumber, tokenData, code)
      .then((uid: string) => {
        const hashed: string = this.hashPassword(password);
        return UserModel.findByIdAndUpdate(uid, { password: hashed });
      })
      .then((user: DBUser | null) => this.controller.createUserToken(user))
      .then((authToken: string) => this.removeChangePasswordToken(authToken, tokenData.id))
      .then((token: string) => this.sendChangePasswordEmail(phoneNumber, token));
  }

  private async createUserHandler(authData: AuthData, resourceType: ResourceType): Promise<{ token: string; uid: string }> {
    const user: DBUser = await this.controller.createUser(authData, resourceType);
    const token: string = await this.controller.createUserToken(user);

    if (authData.email) {
      await Mailer.sendRegistrationEmail(authData.email, authData.firstName, authData.lastName)
        .catch((error) => {
          logger.log(logLevels.error, error);
        });
    }

    return this.smsHelper.sendAuthCode(user).then(() => {
      return {
        token,
        uid: user._id.toString()
      };
    });
  }

  private async sendChangePasswordEmail(phoneNumber: string, token: string): Promise<string> {
    const user: DBUser = await UserModel.findOne({ phoneNumber }, { email: 1 });
    if (user.email) {
      await getFhirResourceId(user._id)
        .then((data) => getUserResource<Person>(data.fhirId, data.resourceType))
        .then((person: Person) => {
          const name: HumanName = person.name.find((n: HumanName) => n.use === NameUse.official);
          return Mailer.sendChangePasswordEmail(user.email, name.given[0], name.family).then(() => void 0);
        });
    }
    return token;
  }

  private saveLastLogin(uid: string): Promise<DBUser> {
    return UserModel.findByIdAndUpdate(uid, { lastLogin: DateTime.local().toISO() }).exec();
  }

  private hashPassword(password: string): string {
    const salt: string = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  private removeChangePasswordToken(authToken: string, tokenId: string): Promise<string> {
    return this.tokenGenerator.removeToken(tokenId).then(() => authToken);
  }

  private async checkPasswordChangeToken(phoneNumber: string, tokenData: TokenData, code: string): Promise<string> {
    const userPhone: UserPhone = await this.tokenGenerator.checkToken(tokenData)
      .then((decoded: TokenPayload) => {
        if (decoded.action !== TokenAction.CHANGE_PASSWORD) {
          throw new CustomError(ErrorCode.INVALID_TOKEN, 'Incorrect token action');
        }
        return assert<UserPhone>(decoded.data);
      });
    if (userPhone.phoneNumber !== phoneNumber) {
      throw new CustomError(ErrorCode.INVALID_TOKEN, 'Incorrect phone number');
    }

    return UserModel.findOne({ phoneNumber })
      .then((user: DBUser | null) => this.smsHelper.checkAuthCode(user, code))
      .then(() => userPhone.uid);
  }
}
