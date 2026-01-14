import {Identifier} from './identifier';
import {HumanName} from './human-name';
import {ContactPoint} from './contact-point';
import {Gender} from './gender';
import {Address} from './address';
import {Resource} from './resource';

export interface Person extends Resource {
    identifier: Identifier[];
    gender: Gender;
    name?: HumanName[];
    telecom: ContactPoint[];
    address?: Address[];
    id?: string;
    active: boolean;
}
