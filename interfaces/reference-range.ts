import { Document } from 'mongoose';
import { Quantity } from './quantity';
import { CodeableConcept } from './codeable-concept';
import { Range } from './range';
import { ObservationType } from './observation';
import { Gender } from './gender';

export interface ReferenceRange {
  low: Quantity;
  high: Quantity;
  /**
   * ObservationType
   */
  type: CodeableConcept;
  appliesTo: CodeableConcept[];
  age: Range;
}

export interface DBReferenceRange extends Document {
  low: Quantity;
  high: Quantity;
  type: ObservationType;
  appliesTo: Gender;
  age: Range;
}
