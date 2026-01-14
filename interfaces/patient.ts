import {RelatedPerson} from './related-person';
import { Resource } from './resource';

export interface Patient extends RelatedPerson {
  generalPractitioner?: Resource;
}

