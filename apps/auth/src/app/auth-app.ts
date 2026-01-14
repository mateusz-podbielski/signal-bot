import { DateTime } from 'luxon';
import { UserModel } from '@signalbot-backend/schemas';
import {
  Auth2Token,
  DBUser,
  SimpleAuth,
  TokenAction,
  TokenPayload,
  UserData,
  UserModelInterface
} from '@signalbot-backend/interfaces';
import { JwtHelper, TokenGenerator } from '@signalbot-backend/jwt-helper';
import { Authenticate } from '@signalbot-backend/authenticate';
import { conf } from '@conf';
import ms from 'ms';

export class AuthApp {
  private static instance: AuthApp;

  public static getInstance(): AuthApp {
    if (!AuthApp.instance) {
      AuthApp.instance = new AuthApp();
    }
    return AuthApp.instance;
  }

  /**
   * Authenticate the user with login (phone number) and password
   * @param simpleAuth
   */
  public simpleAuth(simpleAuth: SimpleAuth): Promise<string> {
    return (UserModel as UserModelInterface)
      .authenticate(simpleAuth.phoneNumber, simpleAuth.password)
      .then((user: DBUser) => Promise.all([AuthApp.createUserToken(user), AuthApp.saveLastLogin(user._id)]))
      .then(([token, user]: [string, DBUser]) => token);
  }

  /**
   * Generates the refresh token, 6 h valid.
   * @param userAuthToken user authentication token obtained in simple auth
   * @param audience the refresh token requester client_id
   */
  public async getRefreshToken(userAuthToken: string, audience: string): Promise<Auth2Token> {
    return Authenticate.verify(userAuthToken)
      .then((user: UserData) => AuthApp.generateRefreshTokens(user._id, audience));
  }

  /**
   * Renewing the user auth token base on provided refresh token
   * @param refreshToken refresh token
   * @param audience the source of request
   */
  public async renewAuthToken(refreshToken: string, audience: string): Promise<Auth2Token> {
    const payload: TokenPayload = await JwtHelper.decode<TokenPayload>(refreshToken, {
      audience,
      subject: TokenAction.REFRESH
    });
    return UserModel.findById(payload.data.uid)
      .then((dbUser: DBUser) => {
        const expiresIn: number = ms(conf.AUTH_TOKEN_LIFETIME) + Date.now();
        return { authToken: AuthApp.createUserToken(dbUser), expiresIn };
      });
  }

  private static generateRefreshTokens(uid: string, audience: string): Promise<Auth2Token> {
    return UserModel.findById(uid).then((user: DBUser) => {
      return Promise.all([
        Promise.resolve(AuthApp.createUserToken(user)),
        TokenGenerator.generate_v2({ uid }, TokenAction.REFRESH, conf.REFRESH_TOKEN_LIFETIME, audience)
      ]);
    }).then(([authToken, refreshTokenData]: [string, { token: string, expires: number }]) => ({
      authToken,
      refreshToken: refreshTokenData.token,
      expires: refreshTokenData.expires
    }));
  }

  private static createUserToken(user: DBUser): string {
    return JwtHelper.sign(
      { data: { _id: user._id, roles: user.roles } }, {
        expiresIn: conf.AUTH_TOKEN_LIFETIME,
        subject: TokenAction.AUTH_TOKEN
      });
  }

  private static saveLastLogin(uid: string): Promise<DBUser> {
    return UserModel.findByIdAndUpdate(uid, { lastLogin: DateTime.local().toISO() }).exec();
  }
}
