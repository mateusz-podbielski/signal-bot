import fs from 'fs-extra';
import {Response} from 'express';
import multer, { Multer, StorageEngine } from 'multer';
import {v4} from 'uuid';
import { Attachment, UserDataRequest } from '@signalbot-backend/interfaces';
import { conf } from '@conf';

export class StaticFilesController {
  private static storage: StorageEngine = multer.diskStorage({
    destination: (req: UserDataRequest, file: Express.Multer.File, callback: (error: (Error | null), filename: string) => void) => {
      const dir = `${process.env.BACKEND_UPLOAD_PATH || conf.BACKEND_UPLOAD_PATH}/${req.userData._id}`;
      fs.ensureDir(dir).then(() => {
        callback(null, dir);
      });
    },
    filename: (req: UserDataRequest, file: Express.Multer.File, callback: (error: (Error | null), filename: string) => void) => {
      callback(null, v4());
    }
  });

  public static upload: Multer = multer({ storage: StaticFilesController.storage });

  public static download(attachment: Attachment, resp: Response): void {
    resp.writeHead(200, {
      'Content-Type': attachment.contentType,
      'Content-Disposition': `attachment; filename=${attachment.title}`,
    });
    fs.createReadStream(attachment.url).pipe(resp);
  }
}
