import { check, query } from 'express-validator';

export class Validator {
  public static replaceAttachmentValidator = [
    query('url').exists(),
  ];

  public static shareValidator = [
    check('email').isEmail()
      .withMessage('Missing or incorrect email address'),
  ];
}
