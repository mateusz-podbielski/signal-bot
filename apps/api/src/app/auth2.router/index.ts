import AppRouter from '../app.router';
import { Request, Response } from 'express';
import { ServiceBroker } from 'moleculer';
import { ApiServiceBroker } from '../api-service-broker';
import { AuthActions, BrokerServiceName, Auth2, Auth2Token } from '@signalbot-backend/interfaces';
import { errorHandler } from '../error-handler';
import { Validator } from './validator';
import { expressValidate } from '@signalbot-backend/validators';

export class Auth2Router extends AppRouter {
  private broker: ServiceBroker = ApiServiceBroker.getInstance().broker;

  public routes(): void {
    this.router.get(
      '/',
      Validator.getRefreshToken,
      expressValidate,
      this.authenticateRouteHandler.bind(this)
    );
  }

  private authenticateRouteHandler(req: Request, resp: Response): void {
    switch (req.query.grant_type) {
      case 'refresh_token':
        this.refreshRouteHandler(req, resp);
        break;
      case 'auth_token':
        this.getAuthTokenHandler(req, resp);
        break;
    }
  }

  private getAuthTokenHandler(req: Request, resp: Response): void {
    this.broker.call<Auth2Token, Auth2>(`${BrokerServiceName.AUTH_APP_SERVICE}.${AuthActions.renewAuthToken}`, {
      token: req.query.token as string,
      audience: req.query.client_id as string
    }).then((authToken: Auth2Token) => resp.send(authToken)).catch(errorHandler(resp));
  }

  private refreshRouteHandler(req: Request, resp: Response): void {
    this.broker.call<Auth2Token, Auth2>(`${BrokerServiceName.AUTH_APP_SERVICE}.${AuthActions.generateRefreshToken}`, {
      token: req.query.token as string,
      audience: req.query.client_id as string
    }).then((response: Auth2Token) => resp.send(response)).catch(errorHandler(resp));
  }
}
