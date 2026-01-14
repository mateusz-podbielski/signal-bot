import { check, query } from 'express-validator';

export class Validator {
  public static registerDeviceValidator = [
    check('patientId')
      .isString()
      .withMessage('Missing or incorrect patientId'),
    check('serialNumber').exists(),
    check('name').isString()
  ];
}
