import { Model, Schema } from 'mongoose';
import { DBReferenceRange } from '@signalbot-backend/interfaces';
import * as mongoose from 'mongoose';

export const ReferenceRangeSchema: Schema<DBReferenceRange> = new Schema<DBReferenceRange>({
  low: {
    value: Number,
    unit: String,
    comparator: String
  },
  high: {
    value: Number,
    unit: String,
    comparator: String
  },
  type: String,
  appliesTo: String,
  age: {
    low: {
      value: Number,
      unit: String,
      comparator: String
    },
    high: {
      value: Number,
      unit: String,
      comparator: String
    }
  },
});

export const ReferenceRangeModel: Model<DBReferenceRange> =
  mongoose.model<DBReferenceRange>('ReferenceRange', ReferenceRangeSchema);
