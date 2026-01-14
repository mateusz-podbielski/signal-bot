import * as jwt from 'jsonwebtoken';
import { NextFunction, RequestHandler, Response } from 'express';
import { difference } from 'lodash';
import {
  Role,
  TokenPayload,
  UserData,
  UserDataRequest
} from '@signalbot-backend/interfaces';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { VerifyErrors, VerifyOptions } from 'jsonwebtoken';

export class Authenticate {
  /**
   * Middleware to check that user is authorized
   * @param req
   * @param res
   * @param next
   */
  public static ensureAuthorized(req: UserDataRequest, res: Response, next: NextFunction): void {
    const xAuthToken = req.get('x-auth-token');
    if (typeof xAuthToken !== 'undefined') {
      Authenticate.verify(xAuthToken).then((userData: UserData) => {
        req.userData = userData;
        next();
      }).catch(() => {
        res.status(401).send(new CustomError(ErrorCode.INVALID_AUTH_TOKEN, 'Missing, incorrect or expired Bearer token'));
      });
    } else {
      res.status(401).send(new CustomError(ErrorCode.INSUFFICIENT_PRIVILEGES));
    }
  }

  public static verify(xAuthToken, options?: VerifyOptions): Promise<UserData> {
    return new Promise<UserData>((resolve, reject) => {
      jwt.verify(xAuthToken, process.env.BACKEND_SECRET || '', {...options, ignoreExpiration: false}, (err: VerifyErrors, decoded: TokenPayload) => {
        if (err) {
          reject(new CustomError(ErrorCode.INVALID_AUTH_TOKEN, 'Invalid token'));
        } else {
          resolve((decoded.data as unknown) as UserData);
        }
      });
    });
  }

  /**
   * Returns middleware to check access level base on user roles
   * @param granted
   */
  public static grantAccess(granted: Role[]): RequestHandler {
    return (req: UserDataRequest, res: Response, next: NextFunction) => {
      if (!req.userData) {
        res.status(403).send(new CustomError(ErrorCode.INVALID_CREDENTIALS));
      } else if (Authenticate.compareRoles(req.userData.roles, granted)) {
        next();
      } else {
        res.status(403).send(new CustomError(ErrorCode.INSUFFICIENT_PRIVILEGES));
      }
    };
  }

  private static compareRoles(roles: Role[], granted: Role[]): boolean {
    const diff: Role[] = difference(roles, granted);
    return diff.length === 0;
  }
}
