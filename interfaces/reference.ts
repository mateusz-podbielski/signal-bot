import {ResourceType} from './resource';

export interface Reference {
    type: ResourceType;
    reference: string;
}
