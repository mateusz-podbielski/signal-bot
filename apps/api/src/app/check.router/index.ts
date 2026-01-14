import { Request, Response } from 'express';
import AppRouter from '../app.router';
import { Validator } from './validator';
import { expressValidate } from '@signalbot-backend/validators';

export class CheckRouter extends AppRouter {
  protected routes(): void {
    this.router.get('/pesel/:value', Validator.pesel, expressValidate, (req: Request, resp: Response) => {
      resp.status(204).send();
    });
  }
}
