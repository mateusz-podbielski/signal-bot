import { Context, ServiceSchema } from 'moleculer';
import {
  AuthActions,
  BrokerServiceName,
  Auth2,
  ServicesNodes,
  SimpleAuth,
  Auth2Token
} from '@signalbot-backend/interfaces';
import { AbstractBroker } from '../../../abstract-broker';
import { AuthApp } from './auth-app';

export class AuthAppBroker extends AbstractBroker {

  protected schema: ServiceSchema = {
    name: BrokerServiceName.AUTH_APP_SERVICE,
    actions: {
      [AuthActions.loginPassAuth]: async (ctx: Context): Promise<string> =>
        AuthApp.getInstance().simpleAuth(AbstractBroker.contextParams<SimpleAuth>(ctx)),
      [AuthActions.generateRefreshToken]: async (ctx: Context): Promise<Auth2Token> => AuthAppBroker.getRefreshToken(ctx),
      [AuthActions.renewAuthToken]: async (ctx: Context): Promise<Auth2Token> => AuthAppBroker.renewAuthToken(ctx),
    }
  };

  private static getRefreshToken(ctx: Context): Promise<Auth2Token> {
    const params: Auth2 = AbstractBroker.contextParams<Auth2>(ctx);
    return AuthApp.getInstance().getRefreshToken(params.token, params.audience);
  }

  private static renewAuthToken(ctx: Context): Promise<Auth2Token> {
    const params: Auth2 = AbstractBroker.contextParams<Auth2>(ctx);
    return AuthApp.getInstance().renewAuthToken(params.token, params.audience);
  }

  constructor() {
    super(ServicesNodes.AUTH_APP_NODE);
  }
}
