import { check, param } from 'express-validator';
import { Gender } from '@signalbot-backend/interfaces';

const PATCH_PROPERTIES: string[] = ['gender', 'firstName', 'lastName', 'addressLine', 'postalCode', 'city', 'email', 'pwz', 'academicTitle', 'specialty'];
const SPECIALTIES: string[] = [
  '221214', '221260', '0731', '0707', '0740', '0797', '0743', '0744', '0721', '0730', '0747', '0748', '0752', '0719', '0723', '0801', '0724', '0725', '0727', '0726', '0728', '0757', '0729', '0782', '0786'
];
export class Validator {
  public static patchPropertyValidator = [
    param('propertyName')
      .exists()
      .isIn(PATCH_PROPERTIES)
      .withMessage('Property not allowed for Practitioner'),
    check('value').exists()
      .custom((value: string, { req }) => {
        switch (req.params.propertyName) {
          case 'gender':
            return value === Gender.female || value === Gender.male || value === Gender.other || value === Gender.unknown;
          case 'postalCode':
            return /^\d{2}-\d{3}$/.test(value);
          case 'specialty':
            return SPECIALTIES.includes(value);
          default:
            return true;
        }
      })
      .withMessage('Incorrect property value'),
  ];
}
