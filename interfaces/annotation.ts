import { Reference } from './reference';

export interface Annotation {
  authorReference?: Reference;
  time?: string;
  text: string;
}
