import { Response } from 'express';
import { AppMessageController } from '@signalbot-backend/controllers';
import { DBAppMessage, UserDataRequest } from '@signalbot-backend/interfaces';
import AppRouter from '../app.router';
import { errorHandler } from '../error-handler';

export class MessagesRouter extends AppRouter {
  private controller: AppMessageController = new AppMessageController();

  public routes(): void {
    this.router.get('/', this.getAllRouteHandler.bind(this));
    this.router.get('/count', this.countRouteHandler.bind(this));
    this.router.delete('/:messageId', this.deleteRouteHandler.bind(this));
  }

  private getAllRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.readAll(req.userData._id)
      .then((messages: DBAppMessage[]) => resp.send(messages))
      .catch(errorHandler(resp));
  }

  private countRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.count(req.userData._id)
      .then((count: number) => resp.send({ count }))
      .catch(errorHandler(resp));
  }

  private deleteRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.delete(req.userData._id, req.params.messageId)
      .then(() => resp.status(204).send())
      .catch(errorHandler(resp));
  }
}
