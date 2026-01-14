import {query} from 'express-validator';

export class Validator {
  public static getActionValidator = [
    query('token')
      .exists()
      .isString(),
    query('id')
      .exists()
      .isString(),
  ];
}
