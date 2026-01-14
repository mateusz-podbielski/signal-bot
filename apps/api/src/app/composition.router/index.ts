import { Response } from 'express';
import { CompositionController, StaticFilesController } from '@signalbot-backend/controllers';
import { Attachment, CompositionResponse, UserDataRequest } from '@signalbot-backend/interfaces';
import { expressValidate } from '@signalbot-backend/validators';
import { Validators } from './validators';
import AppRouter from '../app.router';
import { errorHandler } from '../error-handler';

export class CompositionRouter extends AppRouter {
  private controller: CompositionController = new CompositionController();

  public routes(): void {
    this.router.post(
      '/',
      StaticFilesController.upload.array('documents'),
      Validators.createValidator,
      expressValidate,
      this.createRouteHandler.bind(this)
    );
    this.router.get('/', this.getAllRouteHandler.bind(this));
    this.router.post('/:compositionId/share',
      Validators.shareCompositionValidator,
      expressValidate,
      this.shareCompositionRouteHandler.bind(this)
    );
    this.router.put('/:compositionId/meta',
      Validators.createValidator,
      expressValidate,
      this.updateMetaRouteHandler.bind(this)
    );
    this.router.get('/document/:docRefId', this.getDocumentRouteHandler.bind(this));
    this.router.delete('/document/:docRefId', this.deleteDocumentRouteHandler.bind(this));
  }

  private shareCompositionRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.shareDocumentsWithEmail(
      req.userData._id,
      req.body.email,
      req.body.subject,
      req.body.message,
      req.params.compositionId
    ).then((res) => resp.send(res))
      .catch(errorHandler(resp));
  }

  private getAllRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.readAll(req.userData._id)
      .then((compositions: CompositionResponse[]) => resp.send(compositions))
      .catch(errorHandler(resp));
  }

  private updateMetaRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.updateMeta(req.userData._id, req.params.compositionId, req.body)
      .then((compositionResponse: CompositionResponse) => resp.send(compositionResponse))
      .catch(errorHandler(resp));
  }

  private getDocumentRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.getFiles(req.params.docRefId).then((attachments: Attachment[]) => {
      attachments.forEach((attachment: Attachment) => StaticFilesController.download(attachment, resp));
    });
  }

  private createRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.create(req.userData._id, req.body, req.files as Express.Multer.File[])
      .then((composition) => {
        resp.send(composition);
      })
      .catch(errorHandler(resp));
  }

  private deleteDocumentRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.delete(req.userData._id, req.params.docRefId).then((effect: 'deleted' | 'archived') => {
      resp.send({ effect });
    }).catch(errorHandler(resp));
  }
}
