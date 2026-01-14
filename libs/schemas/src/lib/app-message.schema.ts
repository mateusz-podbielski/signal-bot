import { Model, Schema, Types } from 'mongoose';
import * as mongoose from 'mongoose';

import { DBAppMessage } from '@signalbot-backend/interfaces';

export const AppMessageSchema: Schema<DBAppMessage> = new Schema({
  message: {type: String, required: true},
  from: {type: Types.ObjectId, required: false},
  to: {type: Types.ObjectId, required: true},
  action: {
    type: {
      actionType: String,
      url: String,
    }
  },
  createdAt: { type: Date, required: true, default: Date.now },
});

export const AppMessageModel: Model<DBAppMessage> = mongoose.model<DBAppMessage>('AppMessage', AppMessageSchema);
