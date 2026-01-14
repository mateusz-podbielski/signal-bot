import { param, CustomValidator } from 'express-validator';
import { PatientController } from '@signalbot-backend/controllers';
import { PeselValidator } from '@signalbot-backend/validators';

export const checkPesel: CustomValidator = (value: string) => new PatientController().isUniquePESEL(value)
  .then((isUnique: boolean) => isUnique ? Promise.resolve() : Promise.reject())

export const checkPeselFormat: CustomValidator = (value: string) => PeselValidator.validate(value);

export class Validator {
  public static pesel = [
    param('value')
      .exists()
      .custom(checkPeselFormat)
      .withMessage('Incorrect PESEL format'),
    param('value')
      .exists()
      .custom(checkPesel)
      .withMessage('PESEL already in database')
  ];
}
