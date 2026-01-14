import { Response } from 'express';

import { ChargeItemController, StaticFilesController } from '@signalbot-backend/controllers';
import {
  Attachment,
  ChargeItem,
  ChargeItemWithBill, DocumentContent,
  DocumentReference,
  UserDataRequest
} from '@signalbot-backend/interfaces';
import { expressValidate } from '@signalbot-backend/validators';
import AppRouter from '../app.router';
import { Validator } from './validator';
import { errorHandler } from '../error-handler';

export class ChargeItemRouter extends AppRouter {
  private controller: ChargeItemController = new ChargeItemController();

  public routes(): void {
    this.router.post(
      '/',
      StaticFilesController.upload.array('bill'),
      Validator.createChargeItemValidator,
      expressValidate,
      this.createRouteHandler.bind(this)
    );

    this.router.get('/', this.readAllRouteHandler.bind(this));
    this.router.get('/:chargeItemId/bill', this.getAllBillsRouteHandler.bind(this));
    this.router.get('/:chargeItemId', this.readRouteHandler.bind(this));
    this.router.put('/:chargeItemId',
      Validator.createChargeItemValidator,
      expressValidate,
      this.updateChargeItem.bind(this)
    );
    this.router.patch('/:chargeItemId/files',
      StaticFilesController.upload.array('bill'),
      this.patchFilesRouteHandler.bind(this)
    );
    this.router.patch('/:chargeItemId/status',
      Validator.changeStatusValidator,
      expressValidate,
      this.updateChargeItemStatusRouteHandler.bind(this)
    );
    this.router.delete('/:chargeItemId', this.deleteChargeItemRouteHandler.bind(this));
    this.router.delete('/:chargeItemId/bill',
      Validator.dropFileValidator,
      expressValidate,
      this.dropChargeItemBill.bind(this)
    );
  }

  private patchFilesRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.patchChargeItemFiles(req.params.chargeItemId, req.files as Express.Multer.File[])
      .then((chargeItem: ChargeItemWithBill) => resp.send(chargeItem))
      .catch(errorHandler(resp));
  }

  private updateChargeItem(req: UserDataRequest, resp: Response): void {
    this.controller.update(req.userData._id, req.params.chargeItemId, req.body)
      .then((chargeItem: ChargeItem) => resp.send(chargeItem))
      .catch(errorHandler(resp));
  }

  private updateChargeItemStatusRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.update(req.userData._id, req.params.chargeItemId, req.body.status)
      .then((chargeItem: ChargeItem) => resp.send(chargeItem))
      .catch(errorHandler(resp));
  }

  private dropChargeItemBill(req: UserDataRequest, resp: Response): void {
    this.controller.dropChargeItemFile(req.userData._id, req.params.chargeItemId, req.query.url as string)
      .then((chargeItem: ChargeItemWithBill) => resp.send(chargeItem))
      .catch(errorHandler(resp));
  }

  private deleteChargeItemRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.delete(req.userData._id, req.params.chargeItemId)
      .then(() => resp.status(204).send())
      .catch(errorHandler(resp));
  }

  private getAllBillsRouteHandler(req: UserDataRequest, resp: Response): void {
    const promise: Promise<Attachment[]> = req.query.url
      ? this.controller.findDocRefByFileUrl(req.params.chargeItemId, req.query.url as string)
        .then((docRef: DocumentReference) => docRef.content.map((doc: DocumentContent) => doc.attachment))
      : this.controller.read(req.params.chargeItemId)
        .then((item: ChargeItemWithBill) => item.bills);

    promise.then((attachments: Attachment[]) => {
      attachments.forEach((attachment: Attachment) => {
        StaticFilesController.download(attachment, resp);
      });
    });
  }

  private readRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.read(req.params.chargeItemId)
      .then((item: ChargeItemWithBill) => resp.send(item))
      .catch(errorHandler(resp));
  }

  private readAllRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.readAll(req.userData._id)
      .then((items: ChargeItemWithBill[]) => resp.send(items))
      .catch(errorHandler(resp));
  }

  private createRouteHandler(req: UserDataRequest, resp: Response): void {
    this.controller.create(req.userData._id, req.body, req.files as Express.Multer.File[])
      .then((chargeItem: ChargeItemWithBill) => resp.send(chargeItem))
      .catch(errorHandler(resp));
  }
}
