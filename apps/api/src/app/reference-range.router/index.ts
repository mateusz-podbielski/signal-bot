import { Request, Response } from 'express';
import { ReferenceRangeController } from '@signalbot-backend/controllers';
import { DBReferenceRange } from '@signalbot-backend/interfaces';
import { expressValidate } from '@signalbot-backend/validators';

import { errorHandler } from '../error-handler';
import AppRouter from '../app.router';
import { Validator } from './validator';

export class ReferenceRangeRouter extends AppRouter {
  private controller = new ReferenceRangeController();

  public routes(): void {
    this.router.post('/', Validator.refRangeValidator, expressValidate, this.createRouteHandler.bind(this));
  }

  private createRouteHandler(req: Request, resp: Response): void {
    this.controller.create(req.body)
      .then((refRange: DBReferenceRange) => resp.send(refRange))
      .catch(errorHandler(resp));
  }
}
