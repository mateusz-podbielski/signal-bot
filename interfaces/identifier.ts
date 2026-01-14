import { CodeableConcept } from './codeable-concept';

export enum IdentifierUse {
  usual = 'usual',
  official = 'official',
  temp = 'temp',
  secondary = 'secondary',
  old = 'old'
}

export enum IdentifierCode {
  /**
   * pesel
   */
  PESEL = 'PESEL',

  /**
   * NIP
   * @link http://hl7.org/fhir/v2/0203/index.html#v2-0203
   */
  TAX = 'TAX',

  /**
   * Social media oAuth2 provider - Facebook
   */
  FACEBOOK = 'FACEBOOK',

  /**
   * Social media oAuth2 provider - Google
   */
  GOOGLE = 'GOOGLE',

  /**
   * Social media oAuth2 provider - Apple
   */
  APPLE = 'APPLE',

  /**
   * Identifier of internal MongoDB resource
   */
  MONGO = 'MONGO',

  /**
   * Medical License number
   * @link http://hl7.org/fhir/v2/0203/index.html#v2-0203
   */
  MD = 'MD'
}

export interface Identifier {
  use: IdentifierUse;
  type: CodeableConcept;
  system: string;
  value: string;
}
