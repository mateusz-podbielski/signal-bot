import { Response } from 'express';
import { UserDataRequest } from '@signalbot-backend/interfaces';
import { FcmController } from '@signalbot-backend/controllers';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { expressValidate } from '@signalbot-backend/validators';
import { Validator } from './validator';
import AppRouter from '../app.router';

export class FcmRouter extends AppRouter {
  private controller: FcmController = new FcmController();

  public routes(): void {
    this.router.get('/:tokenId', this.getRouteHandler.bind(this));
    this.router.delete('/:tokenId', this.deleteTokenRouteHandler.bind(this));
    this.router.post('/', Validator.createTokenValidator, expressValidate, this.createRouteHandler.bind(this));
  }

  private getRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.read(req.userData._id, req.params.tokenId).then((token: string) => {
      resp.send({ token });
    })
      .catch((err: CustomError) => {
        switch (err.code) {
          case ErrorCode.RESOURCES_NOT_FOUND:
            resp.status(404).send(err);
            break;
          default:
            resp.status(500).send(err);
            break;
        }
      })
  }

  private createRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.create(req.userData._id, req.body.token).then((tokenId: string) => {
      resp.send({ tokenId });
    });
  }

  private deleteTokenRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.delete(req.userData._id, req.params.tokenId)
      .then(() => resp.status(204).send())
      .catch((err) => {
        resp.status(500).send(err);
      })
  }
}
