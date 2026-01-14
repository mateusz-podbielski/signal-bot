import { body, check, query, param } from 'express-validator';
import { DBUser, PractitionerRoleCode, ResourceType } from '@signalbot-backend/interfaces';
import { PeselValidator, Validators } from '@signalbot-backend/validators';
import { UserModel } from '@signalbot-backend/schemas';
import { PatientController } from '@signalbot-backend/controllers';

const RESOURCE_TYPE = ['Patient', 'RelatedPerson', 'Practitioner'];
const PRACTITIONER_ROLE_CODE: string[] = ['PHY', 'NRS', 'THE', 'PSY', 'OTH'];
const ACADEMIC_TITLES: string[] = ['lek.med.', 'dr.n.med.', 'dr.hab.n.med.', 'prof.dr.hab.'];

export class Validator {
  public static signUpValidator = [
    query('resourceType')
      .exists()
      .isString()
      .custom((value: string) => RESOURCE_TYPE.includes(value)),
    check('email')
      .if((value: string, { req }) => req.query.resourceType === ResourceType.Patient)
      .optional()
      .isEmail(),
    check('email')
      .if((value: string, { req }) => req.query.resourceType !== ResourceType.Patient)
      .exists()
      .isEmail()
      .withMessage('Incorrect email format'),
    check('firstName')
      .exists()
      .isString(),
    check('lastName')
      .exists()
      .isString(),
    check('phoneNumber')
      .custom((phoneNumber: string) => Validators.phoneNumber(phoneNumber))
      .custom(async (value: string) => {
        const user: DBUser = await UserModel.findOne({ phoneNumber: value });
        if (user !== null) {
          return Promise.reject();
        }
        return true;
      })
      .withMessage('Incorrect phone number'),
    check('password')
      .exists()
      .isString()
      .isLength({ min: 8, max: 256 }),
    check('academicTitle')
      .custom((value: string, { req }) => {
        if (req.body.practitionerRole === 'PHY') {
          return ACADEMIC_TITLES.includes(value);
        }
        return true;
      })
      .withMessage('Incorrect or missing academic title'),
    body('practitionerRole')
      .custom(
        (value: string, { req }) => {
          if (req.query?.resourceType as ResourceType !== ResourceType.Practitioner) {
            return true;
          }
          if (!PRACTITIONER_ROLE_CODE.includes(value)) {
            throw new Error('Incorrect qualificationCode');
          }
          return true;
        }
      ),
    body('identifier').custom(
      (value: string, { req }) => {
        if (req.query?.resourceType as ResourceType === ResourceType.RelatedPerson) {
          return true;
        } else if (req.query?.resourceType as ResourceType === ResourceType.Patient) {
          if (PeselValidator.validate(value)) {
            return new PatientController().isUniquePESEL(value).then((isUnique: boolean) => isUnique ? Promise.resolve() : Promise.reject());
          } else {
            throw new Error('Incorrect identifier');
          }
        }
        if (req.body.practitionerRole === 'PSY' || req.body.practitionerRole === 'OTH') {
          return true;
        }

        if (!Validator.validateIdentifier(req.body.practitionerRole, value)) {
          throw new Error('Incorrect identifier');
        }
        return true;
      }
    )
  ];

  public static logInValidator = [
    check('phoneNumber')
      .custom(Validators.phoneNumber)
      .withMessage('Incorrect phone number'),
    check('password')
      .isString()
      .isLength({ min: 8, max: 256 })
      .withMessage('Incorrect password')
  ];

  public static changePasswordValidator = [
    check('code')
      .exists()
      .isString()
      .isLength({ max: 6, min: 6 }),
    check('password')
      .exists()
      .isString()
      .isLength({ min: 8, max: 256 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d'!@#$%^&*()\-_+=;?/.><|{}[\]]/),
    query('token').exists(),
    query('id').exists(),
    param('phoneNumber')
      .exists()
      .isMobilePhone('pl-PL')
  ];

  public static restorePasswordValidator = [
    param('phoneNumber')
      .exists()
      .isMobilePhone('pl-PL')
  ];

  public static checkPhoneNumberValidator = [
    param('phoneNumber')
      .exists()
      .isMobilePhone('pl-PL')
      .custom(async (phoneNumber: string) => {
        const user: DBUser = await UserModel.findOne({ phoneNumber });
        if (user !== null) {
          return Promise.reject();
        }
      })
  ];

  public static resendCodeValidator = [
    param('phoneNumber')
      .exists()
      .isMobilePhone('pl-PL')
      .custom(async (phoneNumber: string) => {
        const user: DBUser = await UserModel.findOne({ phoneNumber });
        if (user === null) {
          return Promise.reject();
        }
        return true;
      })
  ];

  public static confirmPhoneNumberValidator = [
    param('phoneNumber')
      .exists()
      .isMobilePhone('pl-PL')
      .custom(async (phoneNumber: string) => {
        const user: DBUser = await UserModel.findOne({ phoneNumber });
        if (user === null) {
          return Promise.reject();
        }
      }),
    check('code')
      .exists()
      .isString()
      .isLength({ min: 6, max: 6 })
  ];

  public static checkPasswordStrength = [
    query('password')
      .exists()
      .isLength({ min: 8, max: 256 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d'!@#$%^&*()\-_+=;?/.><|{}[\]]/)
  ];

  private static validateIdentifier(practitionerRole: PractitionerRoleCode, identifier?: string): boolean {
    if (identifier === undefined) {
      return false;
    }
    switch (practitionerRole) {
      case PractitionerRoleCode.PHY:
        return Validators.pwz(identifier);
      case PractitionerRoleCode.NRS:
        return Validators.nipip(identifier);
      case PractitionerRoleCode.THE:
        return Validators.pwzfz(identifier);
    }
    return false;
  }
}
