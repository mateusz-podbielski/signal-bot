import { DateTime } from 'luxon';
import { Attachment } from '@signalbot-backend/interfaces';
import { remove } from 'fs-extra';

export class AttachmentController {
  public static getAttachment(file: Express.Multer.File): Attachment {
    return {
      contentType: file.mimetype,
      title: file.originalname,
      creation: DateTime.local().toISODate(),
      size: file.size,
      url: file.path
    };
  }

  public static dropAttachmentFile(attachment: Attachment): Promise<void> {
    return remove(attachment.url);
  }
}
