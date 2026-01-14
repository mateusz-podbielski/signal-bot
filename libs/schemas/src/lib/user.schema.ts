import { Model, Schema } from 'mongoose';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { DateTime } from 'luxon';

import { DBFcmToken, DBUser } from '@signalbot-backend/interfaces';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { conf } from '@conf';
import { InvitationSchema } from './invitation.schema';
import { AppMessageSchema } from './app-message.schema';
export const FcmSchema: Schema<DBFcmToken> = new Schema<DBFcmToken>({
  token: String,
});
export const UserSchema: Schema<DBUser> = new Schema<DBUser>({
  email: { type: String },
  phoneNumber: { type: String },
  fhirId: String,
  password: { type: String },
  roles: [String],
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Number },
  confirmed: { type: Boolean, required: true, default: false },
  authCodeCount: { type: Number, default: 0 },
  lastAuthCode: Date,
  invitations: [InvitationSchema],
  appMessages: [AppMessageSchema],
  fcmToken: [FcmSchema],
  lastLogin: Date
});

export const comparePassword = (user: DBUser, password: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, user.password, (err: Error, isMatch: boolean) => {
      if (err) {
        reject(new CustomError(ErrorCode.INVALID_CREDENTIALS));
      } else resolve(isMatch);
    });
  });
};

UserSchema.pre('save', function(next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user: DBUser = this;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(10, (error: Error, salt: string) => {
    if (error) return next(error);

    bcrypt.hash(user.password, salt,
      (err, hash) => {
        if (err) return next(err);
        user.password = hash;
        next();
      }
    );
  });
});

UserSchema.methods.isLocked = function() {
  if (!this.lockUntil) return false;
  const locked: DateTime = DateTime.fromMillis(this.lockUntil);
  const now: DateTime = DateTime.local();
  return locked > now;
};

UserSchema.methods.incLoginAttempts = function(): Promise<void> {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    }).exec();
  }
  const updates: { [key: string]: unknown } = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + conf.LOCK_TIME };
  }
  return this.update(updates).exec();
};

UserSchema.methods.resetLoginAttempt = function() {
  return this.updateOne({
    $set: { loginAttempts: 1 },
    $unset: { lockUntil: 1 }
  }).exec();
};

UserSchema.statics.authenticate = async function(phoneNumber, password): Promise<DBUser> {
  const user: DBUser | null = await this.findOne({ phoneNumber }).exec();
  if (user === null) {
    throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND);
  }
  if (user.isLocked()) {
    return Promise.reject(new CustomError(ErrorCode.MAX_LOGIN_ATTEMPTS_CODE));
  }
  if (!user.confirmed) {
    return Promise.reject(new CustomError(ErrorCode.USER_NOT_CONFIRMED));
  }
  const compare: boolean = await comparePassword(user, password);
  if (!compare) {
    return user.incLoginAttempts().then(() => Promise.reject(new CustomError(ErrorCode.INVALID_CREDENTIALS)));
  }

  return user.resetLoginAttempt().then(() => Promise.resolve(user));
};

export const UserModel: Model<DBUser> = mongoose.model<DBUser>('User', UserSchema);
