import { Model, Schema, Types } from 'mongoose';
import { DBSystemMessage } from '@signalbot-backend/interfaces';
import * as mongoose from 'mongoose';

export const SystemMessagesSchema: Schema<DBSystemMessage> = new Schema<DBSystemMessage>({
  message: String,
  title: String,
  email: String,
  sendCopyToUser: Boolean,
  uid: Types.ObjectId,
  type: String,
  createdAt: { type: Date, default: new Date() }
});

export const SystemMessageModel: Model<DBSystemMessage> = mongoose.model('SystemMessage', SystemMessagesSchema);
