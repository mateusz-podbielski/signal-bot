import { Resource } from './resource';
import { Reference } from './reference';
import { Period } from './period';

/**
 * @link https://www.hl7.org/fhir/schedule.html
 */
export interface Schedule extends Resource {
  active: boolean;
  actor: Reference[];
  planningHorizon: Period;
  comment: string;
}

export interface SchedulePayload extends Resource {
  planningHorizon: Period;
  comment: string;
  name: string;
}
