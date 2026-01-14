import {Person} from './person';
import {Qualification} from './qualification';
import { Attachment } from './attachment';

/**
 * @link http://hl7.org/fhir/practitioner.html
 */
export interface Practitioner extends Person {
    qualification: Qualification;
    photo?: Attachment[];
}
