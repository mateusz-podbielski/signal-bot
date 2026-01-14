import { Schema, Model } from 'mongoose';
import { DBUserSettings } from '@signalbot-backend/interfaces';
import * as mongoose from 'mongoose';

export const UserSettingSchema: Schema<DBUserSettings> = new Schema<DBUserSettings>({
  messages: { type: Boolean, required: true, default: false },
  notifications: { type: Boolean, required: true, default: false },
  measurements: { type: Boolean, required: true, default: false },
  uid: mongoose.Types.ObjectId
});
export const UserSettingsModel: Model<DBUserSettings> = mongoose.model<DBUserSettings>('UserSettings', UserSettingSchema);
