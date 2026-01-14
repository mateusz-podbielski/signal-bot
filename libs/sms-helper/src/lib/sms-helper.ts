import axios, { AxiosInstance, AxiosResponse } from 'axios';
import querystring from 'querystring';

import {DateTime} from 'luxon';
import {DBUser} from '@signalbot-backend/interfaces';
import {CustomError, ErrorCode} from '@signalbot-backend/custom-error';
import {UserModel} from '@signalbot-backend/schemas';

import {conf} from '@conf';
import { logger, logLevels } from '@signalbot-backend/logger';

const SMS_MAX_COUNT = 5;

export interface AuthCodeSendResponse {
  id: string;
  code: string;
  phone_number: string;
  from: string;
}

export class SmsHelper {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: conf.SMS_API_URL,
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_SMS_API_TOKEN}`,
      },
    });
  }

  public async sendAuthCode(user: DBUser | null): Promise<void> {
    if (user === null) {
      logger.log(logLevels.error, 'User not found to send MFA SMS', new CustomError(ErrorCode.USER_NOT_FOUND, 'User not found to send MFA SMS'));
      throw new CustomError(ErrorCode.USER_NOT_FOUND);
    }
    let count: number = user.authCodeCount;
    if (user.authCodeCount >= SMS_MAX_COUNT) {
      const last: DateTime = DateTime.fromJSDate(user.lastAuthCode)
      if (last.plus({day: 1}) > DateTime.local()) {
        logger.log(logLevels.error, 'Max code attempts for user', user)
        throw new CustomError(ErrorCode.MAX_CODE_ATTEMPTS);
      } else {
        count = 0;
      }
    }
    return this.http.post<AuthCodeSendResponse>('/mfa/codes', {
      phone_number: user.phoneNumber,
      fast: process.env.NODE_ENV === 'production',
    })
      .then(() => SmsHelper.increaseCodeAttempts(user._id, count + 1))
      .then(() => void 0);
  }

  public checkAuthCode(user: DBUser | null, code: string): Promise<void> {
    if (user === null) {
      throw new CustomError(ErrorCode.USER_NOT_FOUND);
    }
    return this.http.post('/mfa/codes/verifications', {
      phone_number: user.phoneNumber,
      code,
    }).then(() => void 0);
  }

  /**
   * Sends plain sms for provided number
   * @param phoneNumber
   * @param message
   */
  public sendSMS(phoneNumber: string, message: string): Promise<void> {
    const queryParams: string = querystring.encode({
      to: phoneNumber,
      message,
      encoding: 'utf-8',
      format: 'json'
    });
    return this.http.get(`/sms.do?${queryParams}`)
      .then((response: AxiosResponse) => {
        logger.log(logLevels.info, 'Response from SMSApi to send simple sms', {response: response.data, phoneNumber, message})
      });
  }

  private static increaseCodeAttempts(uid: string, authCodeCount: number): Promise<void> {
    return UserModel.findByIdAndUpdate(uid, {
      authCodeCount,
      lastAuthCode: new Date(),
    }).then(() => void 0);
  }
}
