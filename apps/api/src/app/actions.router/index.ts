import {Request, Response} from 'express';
import AppRouter from '../app.router';
import {Validator} from './validator';
import { logger, logLevels } from '@signalbot-backend/logger';
import { ActionsController } from '@signalbot-backend/controllers';
import { expressValidate } from '@signalbot-backend/validators';

export class ActionsRouter extends AppRouter {
  private controller: ActionsController;
  constructor() {
    super();
    this.controller = new ActionsController();
  }

  public routes(): void {
    this.router.get('/', Validator.getActionValidator, expressValidate, this.getRouteHandler.bind(this));
  }

  private getRouteHandler(req: Request, resp: Response): void {
    logger.log({level: logLevels.info, message: 'Catch action request', query: req.query});
    this.controller.actionHandler(req.query.token.toString(), req.query.id.toString()).then((redirectUrl: string) => {
      resp.redirect(303, redirectUrl);
    });
  }
}
