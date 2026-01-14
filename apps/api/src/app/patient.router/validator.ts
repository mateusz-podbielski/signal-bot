import { check, param } from 'express-validator';
import { PeselValidator } from '@signalbot-backend/validators';

const PATCH_PROPERTIES: string[] = ['gender', 'firstName', 'lastName', 'addressLine', 'postalCode', 'city', 'email', 'pesel'];

export class Validator {
  public static patchPropertyValidator = [
    param('propertyName')
      .exists()
      .isIn(PATCH_PROPERTIES)
      .withMessage('Property not allowed for Practitioner resource'),
    check('value')
      .exists()
      .custom((value: string, {req}) => {
        switch(req.params.propertyName) {
          case 'gender':
            return ['male', 'female', 'unknown', 'other'].includes(value);
          case 'postalCode':
            return /^\d{2}-\d{3}$/.test(value);
          case 'pesel':
            return PeselValidator.validate(value);
          default:
            return true;
        }
      })
      .withMessage('Incorrect param value'),
  ];
}
