import { check } from 'express-validator';

const RESOURCE_TYPE = ['Patient', 'RelatedPerson', 'Practitioner'];

export default class Validator {
  public static confirmValidator = [
    check('code')
      .exists()
      .isString()
  ];

  public static invitationValidator = [
    check('phoneNumber')
      .exists()
      .isMobilePhone('pl-PL'),
    check('resourceType')
      .exists()
      .custom((value: string) => {
        return RESOURCE_TYPE.includes(value);
      }),
    check('patientId')
      .optional()
      .isString()
  ];

  public static createSettingsValidator = [
    check('messages').isBoolean(),
    check('notifications').isBoolean(),
    check('measurements').isBoolean()
  ];

  public static updateSettingsValidator = [
    check('messages').optional().isBoolean(),
    check('notifications').optional().isBoolean(),
    check('measurements').optional().isBoolean()
  ];

  public static changePasswordValidator = [
    check('password')
      .exists()
      .isString()
      .isLength({ min: 8, max: 256 }),
    check('oldPassword')
      .exists()
      .isString()
      .isLength({ min: 8, max: 256 })
  ];
}
