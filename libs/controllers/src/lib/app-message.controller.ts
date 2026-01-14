import { Types } from 'mongoose';
import { DBAppMessage, DBUser } from '@signalbot-backend/interfaces';
import { UserModel } from '@signalbot-backend/schemas';

export class AppMessageController {
  public async create(message: string, to: string, from: Types.ObjectId): Promise<void> {
    const user: DBUser = await UserModel.findById(to);
    user.appMessages.push({
      message,
      from,
      to: new Types.ObjectId(to)
    });
    return user.save().then(() => void 0);
  }

  public readAll(uid: string): Promise<DBAppMessage[]> {
    return UserModel.findById(uid, { appMessages: 1 })
      .then((user: DBUser) => user.appMessages);
  }

  public count(uid: string): Promise<number> {
    return UserModel.aggregate(
      [
        { $match: { '_id': new Types.ObjectId(uid) } },
        { $unwind: '$appMessages' },
        { $count: 'total' }
      ]
    ).then((result: Array<{ total: number }>) => result[0].total);
  }

  public async delete(uid: string, messageId: string): Promise<void> {
    const user: DBUser = await UserModel.findById(uid, { appMessages: 1 });
    user.appMessages.id(messageId).delete();
    return user.save().then(() => void 0);
  }
}
