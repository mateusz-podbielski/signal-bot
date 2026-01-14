import AppRouter from './app.router';
import { UserDataRequest } from '@signalbot-backend/interfaces';

export class DeviceRegistrationRouter extends AppRouter {
  public routes(): void {
    this.router.post('/', this.deviceRouteRegistrationHandler.bind(this));
  }

  private deviceRouteRegistrationHandler(req: UserDataRequest, resp: Response): void {

  }
}
