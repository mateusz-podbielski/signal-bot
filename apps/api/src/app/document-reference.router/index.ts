import { Response } from 'express';

import { DocumentReferenceController, StaticFilesController } from '@signalbot-backend/controllers';
import { DocumentReference, UserDataRequest } from '@signalbot-backend/interfaces';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { expressValidate } from '@signalbot-backend/validators';

import { Validator } from './validator';
import AppRouter from '../app.router';

export class DocumentReferenceRouter extends AppRouter {
  private controller: DocumentReferenceController = new DocumentReferenceController();

  public routes(): void {
    this.router.put(
      '/:docRefId/attachment',
      StaticFilesController.upload.single('attachment'),
      Validator.replaceAttachmentValidator,
      expressValidate,
      this.replaceFileRouteHandler.bind(this)
    );

    this.router.post('/:docRefId/share',
      Validator.shareValidator,
      expressValidate,
      this.shareDocsRouteHandler.bind(this)
    );
  }

  private shareDocsRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.shareDocument(req.userData._id, req.body.email, req.params.docRefId)
      .then(() => resp.status(204).send())
      .catch((error: CustomError) => {
        switch (error.code) {
          case ErrorCode.RESOURCES_NOT_FOUND:
            resp.status(404).send(error);
            break;
          default:
            resp.status(500).send(error);
            break;
        }
      });
  }

  private replaceFileRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.updateFile(req.userData._id, req.params.docRefId, req.query.url.toString(), req.file)
      .then((docRef: DocumentReference) => resp.send(docRef))
      .catch((err: CustomError) => {
        switch (err.code) {
          case ErrorCode.RESOURCES_NOT_FOUND:
            resp.status(404).send(err);
            break;
          case ErrorCode.METHOD_NOT_ALLOWED:
            resp.status(405).send(err);
            break;
          default:
            resp.status(500).send(err);
            break;
        }
      });
  }
}
