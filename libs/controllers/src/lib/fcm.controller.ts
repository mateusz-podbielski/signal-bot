import mongoose, { Types } from 'mongoose';
import { UserModel } from '@signalbot-backend/schemas';
import { DBFcmToken, DBUser } from '@signalbot-backend/interfaces';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';

export class FcmController {
  /**
   * Saves fcm token for user collection
   * @param uid user identifier
   * @param token fcm token
   */
  public async create(uid: string, token: string): Promise<string> {
    const user: DBUser = await UserModel.findById(uid);
    const fcmToken: Partial<DBFcmToken> = { token, _id: Types.ObjectId() };
    user.fcmToken.push(fcmToken);
    return user.save().then(() => fcmToken._id);
  }

  public read(uid: string, tokenId: string): Promise<string> {
    return UserModel.findById(uid, {fcmToken: 1})
      .then((user: DBUser) => {
        if (user.fcmToken === undefined) {
          throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, 'User has not fcm token registered');
        }
        return user.fcmToken;
      })
      .then((fcmTokenDoc: mongoose.Types.DocumentArray<DBFcmToken>) => {
        const fcmToken: DBFcmToken = fcmTokenDoc.id(tokenId);
        if (fcmToken === null) {
          throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, 'User has not fcm token registered');
        }
        return fcmToken.token;
      })
  }

  public async delete(uid: string, tokenId: string): Promise<void> {
    const user: DBUser = await UserModel.findById(uid);
    await user.fcmToken.id(tokenId).remove();
    return user.save().then(() => void 0);
  }
}
