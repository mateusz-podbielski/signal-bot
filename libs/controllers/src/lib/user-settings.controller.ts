import { Types } from 'mongoose';
import { DBUserSettings, UserSettings } from '@signalbot-backend/interfaces';
import { UserSettingsModel } from '@signalbot-backend/schemas';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';

export class UserSettingsController {
  public create(uid: string, settings: Partial<UserSettings>): Promise<DBUserSettings> {
    const data: Partial<UserSettings> = {
      ...settings,
      uid: new Types.ObjectId(uid)
    };
    return UserSettingsModel.create(data);
  }

  public async read(uid: string): Promise<DBUserSettings> {
    const userSettings: DBUserSettings = await UserSettingsModel.findOne({ uid: new Types.ObjectId(uid) });
    if (userSettings === null) {
      throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, 'User has not saved user settings');
    }
    return userSettings;
  }

  public async update(uid: string, settings: Partial<UserSettings>): Promise<DBUserSettings> {
    const userSettings: DBUserSettings = await UserSettingsModel
      .findOneAndUpdate({ uid: new Types.ObjectId(uid) }, settings, { new: true }).exec();
    if (userSettings === null) {
      throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, 'User has not saved user settings');
    }
    return userSettings;
  }
}
