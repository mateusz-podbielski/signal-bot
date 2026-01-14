import { TokenGenerator } from '@signalbot-backend/jwt-helper';
import * as querystring from 'querystring';
import { DBUser, Invitation, TokenAction, TokenPayload } from '@signalbot-backend/interfaces';
import { UserModel } from '@signalbot-backend/schemas';
import { logger, logLevels } from '@signalbot-backend/logger';
import { assert } from './controller-tools';

export interface ActionHandler {
  (token: string, id: string): Promise<string>;
}

export class ActionsController {
  private tokenGenerator: TokenGenerator = new TokenGenerator();

  private readonly actions: { [key: string]: ActionHandler } = {
    [TokenAction.INVITE_MEMBER]: this.inviteActionHandler
  };

  public actionHandler(token: string, id: string): Promise<string> {
    return this.tokenGenerator.checkToken({ token, id }).then((payload: TokenPayload) => {
      logger.log({level: logLevels.info, message: 'Decoded token payload', payload});
      const action: ActionHandler = this.actions[payload.action];
      return action.call(this, token, id);
    });
  }

  private async inviteActionHandler(token: string, id: string): Promise<string> {
    logger.log({level: logLevels.info, message: 'Data provided to action handler', token, id});
    const invitation: Invitation = await this.tokenGenerator
      .checkToken({ token, id }).then((payload: TokenPayload) => assert<Invitation>(payload.data));
    logger.log(logLevels.info, 'Invitation for new user', { invitation });
    const user: DBUser = await UserModel.findOne({ phoneNumber: invitation.phoneNumber });
    const redirectUrl: string = (user !== null) ? `${process.env.FRONTEND_URL}/login` : `${process.env.FRONTEND_URL}/register?${querystring.stringify({
      token,
      id
    })}`;
    logger.log(logLevels.info, 'Redirect url for invitation', { redirectUrl });
    return redirectUrl;
  }
}
