import { check, CustomValidator, param } from 'express-validator';
import { PeselValidator } from '@signalbot-backend/validators';
import { PatientController } from '@signalbot-backend/controllers';

const FAMILY_RELATIONS: string[] = [
  'HUSB',
  'WIFE',
  'SON',
  'DAU',
  'FTH',
  'MTH',
  'GRPRN',
  'GGRPRN',
  'OTH'
];
const PATCH_PROPERTIES: string[] = ['gender', 'firstName', 'lastName', 'addressLine', 'postalCode', 'city', 'email'];

export const checkPesel: CustomValidator = (value: string) => new PatientController().isUniquePESEL(value)
  .then((isUnique: boolean) => isUnique ? Promise.resolve() : Promise.reject())

export const checkPeselFormat: CustomValidator = (value: string) => PeselValidator.validate(value);

export class Validator {
  public static childValidator = [
    check('firstName')
      .exists()
      .isString(),
    check('lastName')
      .exists()
      .isString(),
    check('identifier')
      .exists()
      .custom(checkPeselFormat)
      .withMessage('Incorrect PESEL value'),
    check('identifier')
      .custom(checkPesel)
      .withMessage('PESEL value is not unique'),
    check('familyRelation')
      .exists()
      .isIn(FAMILY_RELATIONS)
  ];

  public static familyRelationValidator = [
    check('familyRelation')
      .isIn(FAMILY_RELATIONS)
      .withMessage('Incorrect or missing family relation property'),
  ];
  public static patchPropertyValidator = [
    param('propertyName')
      .exists()
      .isString()
      .isIn(PATCH_PROPERTIES),
    check('value')
      .exists()
      .custom((value: string, {req}) => {
        switch(req.params.propertyName) {
          case 'gender':
            return ['male', 'female', 'unknown', 'other'].includes(value);
          case 'postalCode':
            return /^\d{2}-\d{3}$/.test(value);
          default:
            return true;
        }
      })
      .withMessage('Incorrect param value'),
  ];
}
