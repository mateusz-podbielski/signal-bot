import {Model, Schema, Types} from 'mongoose';
import * as mongoose from 'mongoose';
import {DBInvitation} from '@signalbot-backend/interfaces';

export const InvitationSchema: Schema<DBInvitation> = new Schema({
  uid: Types.ObjectId,
  phoneNumber: String,
  resourceType: String,
  firstName: String,
  lastName: String,
  tokenId: String,
  createdAt: {type: Date, required: true, default: Date.now},
});

export const InvitationModel: Model<DBInvitation> = mongoose.model<DBInvitation>('Invitation', InvitationSchema);
