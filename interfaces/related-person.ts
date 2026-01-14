import {Gender} from './gender';
import {HumanName} from './human-name';
import {ContactPoint} from './contact-point';
import {Address} from './address';
import {Identifier} from './identifier';
import {Resource} from './resource';
import {Reference} from './reference';
import { Attachment } from './attachment';

export interface RelatedPerson extends Resource {
    identifier: Identifier[];
    name?: HumanName;
    telecom: ContactPoint[];
    gender: Gender;
    address?: Address[];
    active: boolean;
    patient?: Reference;
    photo?: Attachment[];
}
