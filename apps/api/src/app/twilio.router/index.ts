import { Response } from 'express';
import { UserDataRequest } from '@signalbot-backend/interfaces';
import { TwilioController, TwilioTokenType } from '@signalbot-backend/controllers';
import AppRouter from '../app.router';
import { Validator } from './validator';
import { expressValidate } from '@signalbot-backend/validators';

export class TwilioRouter extends AppRouter {
  private controller: TwilioController = new TwilioController();

  public routes(): void {
    this.router.get('/token/:type',
      Validator.getTokenValidator,
      expressValidate,
      (req: UserDataRequest, resp: Response) => {
        const token: string = this.controller.getAuthToken(
          req.userData._id,
          req.params.type as TwilioTokenType,
          req.query?.room.toString()
        );
        resp.send({ token });
      });

    this.router.post('/chat/channel',
      Validator.channelIdValidator,
      expressValidate,
      (req: UserDataRequest, resp: Response) => {
        this.controller.getChannelName(req.body.requester, req.body.invited).then((channelId) => {
          resp.send({ channelId });
        });
      });
  }
}
