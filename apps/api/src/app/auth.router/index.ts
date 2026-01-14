import {Request, Response} from 'express';
import {AxiosError} from 'axios';

import {
  AuthActions,
  AuthData,
  BrokerServiceName,
  ResourceType,
  ServicesNodes, SimpleAuth,
  TokenData
} from '@signalbot-backend/interfaces';
import {logger, logLevels} from '@signalbot-backend/logger';
import {CustomError, ErrorCode} from '@signalbot-backend/custom-error';
import { expressValidate } from '@signalbot-backend/validators';
import { AuthController } from '@signalbot-backend/controllers';

import {Validator} from './validator';
import AppRouter from '../app.router';
import { errorHandler } from '../error-handler';
import { ServiceBroker } from 'moleculer';
import { ApiServiceBroker } from '../api-service-broker';

export class AuthRouter extends AppRouter {
  private controller: AuthController = new AuthController();
  private broker: ServiceBroker = ApiServiceBroker.getInstance().broker;

  public routes(): void {
    this.router.post('/sign-up',
      Validator.signUpValidator,
      expressValidate,
      this.signUpHandler.bind(this),
    );
    this.router.post('/log-in',
      Validator.logInValidator,
      expressValidate,
      this.authenticateHandler.bind(this),
    );
    this.router.get('/:phoneNumber/restore-password',
      Validator.restorePasswordValidator,
      expressValidate,
      this.restorePasswordHandler.bind(this),
    );
    this.router.post('/:phoneNumber/change-password',
      Validator.changePasswordValidator,
      expressValidate,
      this.changePasswordHandler.bind(this),
    );
    this.router.get('/:phoneNumber/check',
      Validator.checkPhoneNumberValidator,
      expressValidate,
      this.checkPhoneNumberRouteHandler.bind(this),
    );

    this.router.get('/:phoneNumber/resend-code',
      Validator.resendCodeValidator,
      expressValidate,
      this.resendAuthCodeRouteHandler.bind(this),
    );

    this.router.patch('/:phoneNumber/confirm',
      Validator.confirmPhoneNumberValidator,
      expressValidate,
      this.confirmPhoneNumber.bind(this),
    );
    this.router.get(
      '/check-password',
      Validator.checkPasswordStrength,
      expressValidate,
      (req: Request, resp: Response) => {
        resp.status(204).send();
      },
    );
  }

  private resendAuthCodeRouteHandler(req: Request, resp: Response): void {
    this.controller.sendAuthCode(req.params.phoneNumber).then(() => {
      resp.status(204).send();
    }).catch((error: CustomError) => {
      logger.log(logLevels.error, '/user/resend-code path error', error);
      switch (error.code) {
        case ErrorCode.MAX_CODE_ATTEMPTS:
          resp.status(405).send(error);
          break;
      }
    });
  }

  private confirmPhoneNumber(req: Request, resp: Response): void {
    this.controller.confirmPhoneNumber(req.params.phoneNumber, req.body.code).then(() => {
      resp.status(204).send();
    }).catch((error) => {
      logger.log(logLevels.error, '/auth/phoneNumber/confirm path error', error);
      switch (error.response.status) {
        case 404:
          resp.status(404).send(new CustomError(ErrorCode.INCORRECT_CODE, 'Incorrect SMS code'));
          break;
        case 408:
          resp.status(408).send(new CustomError(ErrorCode.EXPIRED_CODE, 'SMS code expired'));
          break;
        default:
          if (error.code === ErrorCode.INCORRECT_FORM_DATA) {
            resp.status(400).send(new CustomError(ErrorCode.INCORRECT_FORM_DATA));
          } else {
            resp.status(500).send(new CustomError(ErrorCode.UNEXPECTED_ERROR));
          }
          break;
      }
    });
  }

  private checkPhoneNumberRouteHandler(req: Request, resp: Response): void {
    resp.status(204).send();
  }

  private async signUpHandler(req: Request, resp: Response): Promise<void> {
    const authData: AuthData = req.body as AuthData;

    const authToken: Promise<{ token: string; uid: string }> = (req.query.token && req.query.id) ?
      this.controller.createInvitedUser(authData, req.query.token.toString(), req.query.id.toString())
      : this.controller.createUser(authData, req.query.resourceType as ResourceType);

    authToken.then((data) => {
      resp.send({token: data.token});
    }).catch((error: unknown) => {
      resp.status(500).send(error);
    })
  }

  private authenticateHandler(req: Request, resp: Response): void {
    this.broker.call<string, SimpleAuth>(
      `${BrokerServiceName.AUTH_APP_SERVICE}.${AuthActions.loginPassAuth}`,
      {phoneNumber: req.body.phoneNumber, password: req.body.password},
      {nodeID: ServicesNodes.AUTH_APP_NODE}
    )
      .then((token: string) => {
        resp.send({token})
      })
      .catch(errorHandler(resp));
  }

  private restorePasswordHandler(req: Request, resp: Response): void {
    this.controller.restorePassword(req.params.phoneNumber)
      .then((tokenData: TokenData) => resp.send(tokenData))
      .catch(errorHandler(resp));
  }

  private changePasswordHandler(req: Request, resp: Response): void {
    const tokenData: TokenData = {
      token: req.query.token as string,
      id: req.query.id as string,
    };
    this.controller.changePassword(
      req.params.phoneNumber as string,
      tokenData,
      req.body.password,
      req.body.code,
    )
      .then((token: string) => {
        resp.send({token});
      })
      .catch((error: AxiosError) => {
        if (error.isAxiosError) {
          switch (error.response.status) {
            case 404:
              resp.status(404).send(new CustomError(ErrorCode.INCORRECT_CODE))
              break;
            case 408:
              resp.status(408).send(new CustomError(ErrorCode.EXPIRED_CODE));
              break;
            default:
              resp.status(500).send(error.response.data);
              break;
          }
        } else {
          resp.status(500).send(error);
        }
      });
  }
}
