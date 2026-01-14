import AppRouter from './app.router';
import { Request, Response } from 'express';
import {version} from '../../../../package.json';

export class VersionRouter extends AppRouter {
  public routes(): void {
    this.router.get('/',(req: Request, resp: Response) => {
      resp.send(version);
    });
  }
}
