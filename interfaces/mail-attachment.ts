export enum MailAttachmentDisposition {
  attachment = 'attachment',
}

export interface MailAttachment {
  content: string;
  filename: string;
  type: string;
  disposition: MailAttachmentDisposition;
  content_id: string;
}
