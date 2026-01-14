import { Resource } from './resource';
import { CodeableConcept } from './codeable-concept';
import { Reference } from './reference';
import { Annotation } from './annotation';
import { Money } from './money';
import { Attachment } from './attachment';
import { Currency } from './currency';

export enum ChargeItemStatus {
  planned = 'planned',
  billable = 'billable',
  notBillable = 'not-billable',
  aborted = 'aborted',
  billed = 'billed',
  enteredInError = 'entered-in-error',
  unknown = 'unknown'
}

export enum ChargeItemType {
  MEDICINES = 'MEDICINES',
  SHOPPING = 'SHOPPING',
  DOCTOR_APP = 'DOCTOR_APP',
  OFFICIAL = 'OFFICIAL',
  OTHER = 'OTHER'
}

export interface ChargeItemPerformer {
  actor: Reference;
}
/**
 * @link http://hl7.org/fhir/chargeitem.html
 */
export interface ChargeItem extends Resource {
  status: ChargeItemStatus;
  code: CodeableConcept;
  note: Annotation[];
  subject: Reference;
  occurrenceDateTime: string;
  performer: ChargeItemPerformer[];
  priceOverride: Money;
  supportingInformation: Reference[];
  // Does not exist in resource - available by extension
  name?: string;
}

export interface ChargeItemPayload {
  amount: number;
  currency: Currency;
  note: string;
  patient: string;
  type: ChargeItemType;
  attachment?: File
  occurrence: string;
  performer: string;
  name: string;
}

export interface ChargeItemWithBill {
  chargeItem: ChargeItem;
  bills?: Attachment[];
}
