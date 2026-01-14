import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import ms from 'ms';
import { DBToken, TokenAction, TokenData, TokenPayload } from '@signalbot-backend/interfaces';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { Token } from '@signalbot-backend/schemas';
import { conf } from '@conf';
import { JwtHelper } from './jwt-helper';

export class TokenGenerator {
  /**
   * Generates token for given action with provided payload data, with expires in given time - default 2h
   * @param data token payload
   * @param action token action
   * @param expiresIn token expiration time
   * @return token data - token and token id
   */
  public async generate(data: Record<string, unknown>, action: TokenAction, expiresIn = '1h'): Promise<TokenData> {
    const payload: TokenPayload = { data };
    const token = jwt.sign(payload, process.env.BACKEND_SECRET, { expiresIn });
    const expiration: number = ms(expiresIn) + Date.now();
    const id: string = await this.saveTokenHash(token, expiration);
    return { token, id };
  }

  public static async generate_v2(data: Record<string, unknown>, action: TokenAction, expires: string, audience: string): Promise<{token: string; expires: number}> {
    const expiresIn: number = ms(expires) + Date.now();
    return JwtHelper.signAsync({ data }, { expiresIn, audience, subject: action })
      .then((token: string) => ({token, expires: expiresIn}));
  }

  public static saveDbToken(dbToken: DBToken, token: string): Promise<string> {
    return TokenGenerator.hash(token).then((hash: string) => {
      dbToken.hash = hash;
      return dbToken.save().then(() => token);
    });
  }

  public removeToken(tokenId: string): Promise<void> {
    return Token.findByIdAndRemove(tokenId).then(() => void 0);
  }

  public async checkToken(tokenData: TokenData): Promise<TokenPayload> {
    const savedToken: DBToken | null = await Token.findById(tokenData.id);
    if (savedToken === null) {
      throw new CustomError(ErrorCode.INVALID_TOKEN, 'Token hash missing or incorrect');
    }
    return TokenGenerator.compare(tokenData.token, savedToken.hash)
      .then(() => {
        return jwt.verify(tokenData.token, process.env.BACKEND_SECRET || '');
      })
      .then((data: unknown) => data as TokenPayload);
  }

  public static hash(value: string): Promise<string> {
    return TokenGenerator.genSalt().then((salt: string) => {
      return new Promise((resolve, reject) => {
        bcrypt.hash(value, salt,
          (err, hash) => {
            if (err) {
              reject(err);
            } else {
              resolve(hash);
            }
          });
      });
    });
  }

  public static genSalt(): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(conf.SALT_WORK_FACTOR, (error, salt) => {
        if (error) {
          reject(error);
        } else {
          resolve(salt);
        }
      });
    });
  }

  private saveTokenHash(token: string, expiresIn: number): Promise<string> {
    return TokenGenerator.hash(token).then((hash: string) =>
      new Token({ hash, expiresIn }).save().then((token: DBToken) => token._id.toString())
    );
  }

  private static compare(token: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(token, hash, (err: unknown, success: boolean) => {
        if (err) {
          reject(new CustomError(ErrorCode.INVALID_TOKEN, 'Invalid token hash'));
        }
        if (success) {
          resolve(true);
        }
      });
    });
  }
}

