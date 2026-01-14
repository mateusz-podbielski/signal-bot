import { Response } from 'express';
import bodyParser from 'body-parser';
import { logger, logLevels } from '@signalbot-backend/logger';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { Attachment, Person, UserDataRequest } from '@signalbot-backend/interfaces';
import { AttachmentController, StaticFilesController, UserController } from '@signalbot-backend/controllers';
import { getUserData } from '@signalbot-backend/user-resource';
import { expressValidate } from '@signalbot-backend/validators';

import AppRouter from '../app.router';
import Validator from './validator';
import { InvitationsRouter } from './invitations.router';
import { CareTeamRouter } from './care-team.router';
import { UserSettingsRouter } from './user-settings.router';
import { errorHandler } from '../error-handler';

export class UserRouter extends AppRouter {
  private controller: UserController = new UserController();

  public routes(): void {
    this.router.get('/', this.getUserRouteHandler.bind(this));
    this.router.get('/resend-code', this.resendAuthCodeRouteHandler.bind(this));
    this.router.get('/last-login', this.getLastLogin.bind(this));
    this.router.get('/:uid/avatar', this.getAvatarRouteHandler.bind(this));
    this.router.patch('/confirm',
      bodyParser.json(),
      Validator.confirmValidator,
      expressValidate,
      this.confirmRouteHandler.bind(this)
    );
    this.router.patch('/avatar', StaticFilesController.upload.single('avatar'), this.patchAvatarRouteHandler.bind(this));
    this.router.patch('/password',
      bodyParser.json(),
      Validator.changePasswordValidator,
      expressValidate,
      this.changePasswordRouteHandler.bind(this)
    );
    this.router.use('/invitations', bodyParser.json(), new InvitationsRouter().router);
    this.router.use('/care-teams', bodyParser.json(), new CareTeamRouter().router);
    this.router.use('/settings', bodyParser.json(), new UserSettingsRouter().router);
  }

  private getLastLogin(req: UserDataRequest, resp: Response): void {
    this.controller.getLastLogin(req.userData._id).then((lastLogin: string) => resp.send({lastLogin}))
      .catch(errorHandler(resp));
  }

  private changePasswordRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.changePassword(req.userData._id, req.body.oldPassword, req.body.password)
      .then(() => resp.status(204).send())
      .catch(errorHandler(resp));
  }

  private getAvatarRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.getAvatar(req.params.uid).then((attachment: Attachment) => StaticFilesController.download(attachment, resp))
      .catch(errorHandler(resp));
  }

  private patchAvatarRouteHandler(req: UserDataRequest, resp: Response) {
    const attachment: Attachment = AttachmentController.getAttachment(req.file);
    this.controller.updateProperty<Person>(req.userData._id, 'photo', attachment)
      .then((person: Person) => resp.send(person))
      .catch(errorHandler(resp));
  }

  private getUserRouteHandler(req: UserDataRequest, resp: Response): void {
    getUserData(req.userData._id.toString()).then((userData: Person) => {
      resp.send(userData);
    });
  }

  private confirmRouteHandler(req: UserDataRequest, resp: Response): void {
    const uid: string = req.userData._id;
    this.controller.confirmPhoneNumber(uid, req.body.code)
      .then(() => resp.status(204).send())
      .catch((error) => {
        logger.log(logLevels.error, '/user/confirm path error', error);
        switch (error.response.status) {
          case 404:
            resp.status(404).send(new CustomError(ErrorCode.INCORRECT_CODE, 'Incorrect SMS code'));
            break;
          case 408:
            resp.status(408).send(new CustomError(ErrorCode.EXPIRED_CODE, 'SMS code expired'));
            break;
          default:
            resp.status(500).send(new CustomError(ErrorCode.UNEXPECTED_ERROR));
            break;
        }
      });
  }

  private resendAuthCodeRouteHandler(req: UserDataRequest, resp: Response): void {
    const uid: string = req.userData._id;
    this.controller.sendAuthCode(uid).then(() => {
      resp.status(204).send();
    }).catch(errorHandler(resp));
  }
}
