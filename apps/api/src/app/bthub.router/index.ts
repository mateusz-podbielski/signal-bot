import { Request, Response } from 'express';
import AppRouter from '../app.router';
import { Device, UserDataRequest } from '@signalbot-backend/interfaces';
import { DevicesController } from '@signalbot-backend/controllers';
import { expressValidate } from '@signalbot-backend/validators';

import { Validator } from './validator';
import { errorHandler } from '../error-handler';

export class BtHubRouter extends AppRouter {
  private controller: DevicesController = new DevicesController();

  public routes(): void {
    this.router.get('/', this.getAllDevicesRouteHandler.bind(this));
    this.router.post(
      '/register',
      Validator.registerDeviceValidator,
      expressValidate,
      this.registerRouteHandler.bind(this)
    );
    this.router.get('/:serialNumber', this.getDeviceRouteHandler.bind(this));
  }

  private getAllDevicesRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.getDevices(req.userData._id).then((devices: Device[]) => {
      resp.send(devices);
    }).catch(errorHandler(resp));
  }

  private registerRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.create(req.userData._id, req.body)
      .then(() => resp.status(204).send())
      .catch(errorHandler(resp));
  }

  private getDeviceRouteHandler(req: Request, resp: Response): void {
    this.controller.getBySerial(req.params.serialNumber).then((device: Device) => {
      resp.send(device);
    }).catch(errorHandler(resp));
  }
}

