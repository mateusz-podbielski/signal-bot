import { Response } from 'express';

import AppRouter from '../app.router';
import { UserSettingsController } from '@signalbot-backend/controllers';
import { DBUserSettings, UserDataRequest, UserSettings } from '@signalbot-backend/interfaces';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { expressValidate } from '@signalbot-backend/validators';

import Validator from './validator';

export class UserSettingsRouter extends AppRouter {
  private controller: UserSettingsController = new UserSettingsController();

  public routes(): void {
    this.router.post('/',
      Validator.createSettingsValidator,
      expressValidate,
      this.createRouteHandler.bind(this)
    );
    this.router.get('/', this.getSettingsRouteHandler.bind(this));
    this.router.patch('/',
      Validator.updateSettingsValidator,
      expressValidate,
      this.patchSettingsRouteHandler.bind(this)
    );
  }

  private createRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.create(req.userData._id, req.body).then((userSettings: DBUserSettings) => {
      resp.send(userSettings);
    }).catch((error: unknown) => resp.status(500).send(error));
  }

  private getSettingsRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.read(req.userData._id).then((userSettings: UserSettings) => {
      resp.send(userSettings);
    })
      .catch((error: CustomError) => {
        if (error.code === ErrorCode.RESOURCES_NOT_FOUND) {
          resp.status(404).send(error);
        } else {
          resp.status(500).send(error);
        }
      });
  }

  private patchSettingsRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.update(req.userData._id, req.body).then((userSettings: DBUserSettings) => {
      resp.send(userSettings);
    })
      .catch((error: CustomError) => {
        if (error.code === ErrorCode.RESOURCES_NOT_FOUND) {
          resp.status(404).send(error);
        } else {
          resp.status(500).send(error);
        }
      });
  }
}
