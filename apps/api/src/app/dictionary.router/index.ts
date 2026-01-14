import { Request, Response } from 'express';
import AppRouter from '../app.router';
import { validateDictionary, Validator } from './validator';

export class DictionaryRouter extends AppRouter {
  public routes(): void {
    this.router.get('/:name',
      Validator.getDictionaryValidator,
      validateDictionary,
      DictionaryRouter.getDictionaryRouteHandler.bind(this)
    );
  }

  private static getDictionaryRouteHandler(req: Request, resp: Response): void {
    import(`../../assets/ValueSet/${req.params.name}.json`)
      .then((data) => resp.send(data.compose.include[0].concept));
  }
}
