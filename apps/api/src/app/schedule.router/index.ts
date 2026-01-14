import { Response } from 'express';

import { Schedule, UserDataRequest } from '@signalbot-backend/interfaces';
import { ScheduleController } from '@signalbot-backend/controllers';
import { expressValidate } from '@signalbot-backend/validators';

import { errorHandler } from '../error-handler';
import AppRouter from '../app.router';
import { Validator } from './validator';

export class ScheduleRouter extends AppRouter {
  private controller: ScheduleController = new ScheduleController();

  public routes(): void {
    this.router.post('/', Validator.createValidator, expressValidate, this.createRouteHandler.bind(this));
    this.router.get('/', this.getAllRouteHandler.bind(this));
    this.router.get('/:id', this.getRouteHandler.bind(this));
    this.router.put('/:id', Validator.createValidator, expressValidate, this.updateRouteHandler.bind(this));
    this.router.patch('/:id', Validator.updateActiveValidator, expressValidate, this.updateActiveRouteHandler.bind(this));
    this.router.delete('/:id', this.deleteRouteHandler.bind(this));
  }

  private createRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.create(req.userData._id, req.body)
      .then((schedule: Schedule) => resp.send(schedule))
      .catch(errorHandler(resp));
  }

  private updateRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.update(req.userData._id, req.params.id, req.body)
      .then((schedule: Schedule) => resp.send(schedule))
      .catch(errorHandler(resp));
  }

  private updateActiveRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.updateActive(req.userData._id, req.params.id, req.body.active)
      .then((schedule: Schedule) => resp.send(schedule))
      .catch(errorHandler(resp));
  }

  private deleteRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.delete(req.params.id, req.userData._id)
      .then(() => resp.status(204).send())
      .catch(errorHandler(resp));
  }

  private getAllRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.readAll(req.userData._id)
      .then((schedules: Schedule[]) => resp.send(schedules))
      .catch(errorHandler(resp));
  }

  private getRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.read(req.userData._id, req.params.id)
      .then((schedule: Schedule) => resp.send(schedule))
      .catch(errorHandler(resp));
  }
}
