import {Model, Schema} from 'mongoose';
import * as mongoose from 'mongoose';
import {DBToken} from '@signalbot-backend/interfaces';

export const TokenSchema: Schema<DBToken> = new Schema({
  hash: String,
  expireIn: Number,
  salt: String,
});

export const Token: Model<DBToken> = mongoose.model<DBToken>('Token', TokenSchema);
