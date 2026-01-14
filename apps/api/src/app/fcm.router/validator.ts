import { check } from 'express-validator';

export class Validator {
  public static createTokenValidator = [
    check('token').exists().withMessage('FCM token is missing'),
    check('token').isString().withMessage('FCM token is not a string'),
  ];
}
