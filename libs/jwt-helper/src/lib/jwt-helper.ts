import * as jwt from 'jsonwebtoken';
import { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { TokenPayload } from '@signalbot-backend/interfaces';

export class JwtHelper {
  private static readonly secret: string = process.env.BACKEND_SECRET || 'TEST_SECRET';

  public static sign(payload: TokenPayload, options: SignOptions): string {
    if (options?.expiresIn === undefined) {
      throw new Error('Missing token expiration string');
    }
    return jwt.sign(payload, JwtHelper.secret, options);
  }

  public static signAsync(payload: TokenPayload, options: SignOptions): Promise<string> {
    if (options?.expiresIn === undefined) {
      throw new Error('Missing token expiration string');
    }
    return new Promise<string>((resolve, reject) => {
      jwt.sign(payload, JwtHelper.secret, options, (err: unknown, token: string) => {
        if(token) resolve(token);
        else reject(err);
      })
    });
  }

  public static decode<T>(token: string, options: VerifyOptions): Promise<T> {
    return jwt.verify(token, JwtHelper.secret, {...options, ignoreExpiration: false}) as Promise<T>;
  }
}
