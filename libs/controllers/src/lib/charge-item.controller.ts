import { FhirResource } from '@signalbot-backend/fhir-connector';
import { flatten } from 'lodash';
import { DateTime } from 'luxon';

import {
  Attachment,
  BundleEntry,
  BundleResponse,
  ChargeItem,
  ChargeItemPayload,
  ChargeItemPerformer,
  ChargeItemStatus,
  ChargeItemWithBill,
  CodeableConcept,
  CodingSystem,
  CompositionStatus,
  DocumentContent,
  DocumentPayload,
  DocumentReference,
  DocumentReferenceStatus,
  DocumentType,
  ExtensionUrl,
  FhirResourceId,
  JsonPatch,
  JsonPatchOperation,
  Reference,
  ResourceExtension,
  ResourceType
} from '@signalbot-backend/interfaces';
import { getFhirResourceId } from '@signalbot-backend/user-resource';
import { DocumentReferenceController } from './document-reference.controller';
import { createReference, extensionIndex } from './controller-tools';
import { CustomError, ErrorCode } from '@signalbot-backend/custom-error';
import { AttachmentController } from './attachment.controller';

export class ChargeItemController {
  private resource: FhirResource = new FhirResource(ResourceType.ChargeItem);
  private documentReferenceController: DocumentReferenceController = new DocumentReferenceController();

  /**
   * Creates new ChargeItem resource
   * @param uid
   * @param payload
   * @param files
   */
  public async create(uid: string, payload: ChargeItemPayload, files?: Express.Multer.File[]): Promise<ChargeItemWithBill> {
    const data: Partial<ChargeItem> = await this.payloadToResource(uid, payload);
    if (files) {
      const documentPayload: DocumentPayload = {
        documentType: DocumentType.bill,
        patient: payload.patient,
        description: DocumentType.bill
      };
      data.supportingInformation = await this.saveChargeItemFiles(uid, documentPayload, files);
    }
    return this.resource.create<ChargeItem>(data).then((chargeItem: ChargeItem) => this.attachDocument(chargeItem));
  }

  /**
   * Reads all charge items where user is performed
   * @param uid user mongo id identifier
   */
  public readAll(uid: string): Promise<ChargeItemWithBill[]> {
    return getFhirResourceId(uid)
      .then((fhirResourceId: FhirResourceId) => this.resource.search<BundleResponse<ChargeItem>>(`performer-actor=${fhirResourceId.fhirId}`))
      .then((response: BundleResponse<ChargeItem>) => {
        if (response.total === 0) {
          return [];
        }
        return response.entry.map((entry: BundleEntry<ChargeItem>) => entry.resource);
      })
      .then((items: ChargeItem[]) => Promise.all(items.map((item: ChargeItem) => this.attachDocument(item))));
  }

  /**
   * Read charge item with given id
   * @param chargeItemId
   */
  public read(chargeItemId: string): Promise<ChargeItemWithBill> {
    return  this.resource.read(chargeItemId)
      .then((chargeItem: ChargeItem) => this.attachDocument(chargeItem))
      .catch(() => Promise.reject(new CustomError(ErrorCode.RESOURCES_NOT_FOUND)));
  }

  public async dropChargeItemFile(uid: string, chargeItemId: string, url: string): Promise<void | ChargeItemWithBill> {
    const doc: DocumentReference = await this.findDocRefByFileUrl(chargeItemId, url);

    const ref: Reference = {
      type: ResourceType.DocumentReference,
      reference: `${ResourceType.DocumentReference}/${doc.id}`
    };
    const chargeItem: ChargeItem = await this.resource.read<ChargeItem>(chargeItemId);
    const refIndex: number = chargeItem.supportingInformation
      .findIndex((r: Reference) => r.reference === ref.reference);

    return this.dropChargeItemDocuments(uid, [ref]).then(() => {
      const patch: JsonPatch = {
        op: JsonPatchOperation.REMOVE,
        path: `/supportingInformation/${refIndex}`
      };
      return this.resource.update<ChargeItem>(chargeItemId, [patch])
        .then((chargeItem: ChargeItem) => this.attachDocument(chargeItem));
    });
  }

  /**
   * Update charge item metadata
   * @param uid
   * @param chargeItemId
   * @param payload
   */
  public async update(uid: string, chargeItemId: string, payload: ChargeItemPayload): Promise<ChargeItem> {
    const data: Partial<ChargeItem> = await this.payloadToResource(uid, payload);
    const idx: number = await extensionIndex(ResourceType.ChargeItem, chargeItemId, ExtensionUrl.name);
    const jsonPatch: JsonPatch[] = [
      {
        op: JsonPatchOperation.REPLACE,
        path: '/priceOverride',
        value: data.priceOverride
      },
      {
        op: JsonPatchOperation.REPLACE,
        path: '/note/0',
        value: data.note[0]
      },
      {
        op: JsonPatchOperation.REPLACE,
        path: '/code',
        value: data.code
      },
      {
        op: JsonPatchOperation.REPLACE,
        path: '/occurrenceDateTime',
        value: data.occurrenceDateTime
      },
      {
        op: JsonPatchOperation.REPLACE,
        path: '/performer/0',
        value: data.performer[0]
      },
      {
        op: JsonPatchOperation.REPLACE,
        path: `/extension/${idx}/valueString`,
        value: payload.name
      }
    ];

    return this.resource.update<ChargeItem>(chargeItemId, jsonPatch);
  }

  public changeStatus(chargeItemId: string, status: ChargeItemStatus): Promise<ChargeItem> {
    const jsonPatch: JsonPatch[] = [
      {
        op: JsonPatchOperation.REPLACE,
        path: '/status',
        value: status
      }
    ];
    return this.resource.update<ChargeItem>(chargeItemId, jsonPatch);
  }

  public async patchChargeItemFiles(chargeItemId: string, files: Express.Multer.File[]): Promise<ChargeItemWithBill> {
    const chargeItem: ChargeItem = await this.resource.read<ChargeItem>(chargeItemId);
    return FhirResource.codeableConceptBuilder(CodingSystem.DocumentType, DocumentType.bill)
      .then((type: CodeableConcept) => {
        return {
          resourceType: ResourceType.DocumentReference,
          status: DocumentReferenceStatus.current,
          docStatus: CompositionStatus.final,
          subject: chargeItem.subject,
          author: chargeItem.performer.map((performer: ChargeItemPerformer) => performer.actor),
          date: DateTime.local().toISODate(),
          description: '',
          content: files.map((file) => ({ attachment: AttachmentController.getAttachment(file) })),
          type
        };
      })
      .then((docRef: DocumentReference) => new FhirResource(ResourceType.DocumentReference).create<DocumentReference>(docRef))
      .then((docRef: DocumentReference) => ({
        type: ResourceType.DocumentReference,
        reference: `DocumentReference/${docRef.id}`
      } as Reference))
      .then((ref: Reference) => {
        const jsonPatch: JsonPatch[] = [
          {
            op: JsonPatchOperation.ADD,
            value: [ref],
            path: chargeItem.supportingInformation ? `/supportingInformation/${chargeItem.supportingInformation.length}` : '/supportingInformation'
          }
        ];
        return this.resource.update<ChargeItem>(chargeItemId, jsonPatch);
      })
      .then((chargeItem: ChargeItem) => this.attachDocument(chargeItem));
  }

  public findDocRefByFileUrl(chargeItemId: string, url: string): Promise<DocumentReference> {
    return this.resource.read<ChargeItem>(chargeItemId)
      .then((chargeItem: ChargeItem) => chargeItem.supportingInformation)
      .then((refs: Reference[]) => {
        if (refs === undefined || refs.length === 0) {
          throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, 'Charge item with given id has not attached files');
        }
        return this.getDocRefsResources(refs);
      })
      .then((docs: DocumentReference[]) => docs.find((doc: DocumentReference) => doc.content.map((content: DocumentContent) => content.attachment.url).includes(url)))
      .then((doc: DocumentReference | undefined) => {
        if (doc === undefined) {
          throw new CustomError(ErrorCode.RESOURCES_NOT_FOUND, 'Charge item with given id has not attached files');
        }
        return doc;
      });
  }

  /**
   * Deletes the charge item
   * @param uid
   * @param chargeItemId
   */
  public async delete(uid: string, chargeItemId: string): Promise<void> {
    const chargeItem: ChargeItemWithBill = await this.read(chargeItemId);

    if (chargeItem.bills && chargeItem.bills.length) {
      await this.dropChargeItemDocuments(uid, chargeItem.chargeItem.supportingInformation).then(() => void 0)
        .catch((err: unknown) => {
          throw err;
        });
    }
    return this.resource.delete(chargeItemId);
  }

  private async attachDocument(chargeItem: ChargeItem): Promise<ChargeItemWithBill> {
    const chargeItemWithBill: ChargeItemWithBill = {
      chargeItem: {
        ...chargeItem,
        name: chargeItem.extension[chargeItem.extension.findIndex((ex: ResourceExtension) => ex.url === 'name')].valueString
      }
    };

    if (chargeItem.supportingInformation === undefined || chargeItem.supportingInformation.length === 0) {
      return chargeItemWithBill;
    }

    chargeItemWithBill.bills = await this.getAttachments(chargeItemWithBill.chargeItem.supportingInformation);

    return chargeItemWithBill;
  }

  private getDocRefsResources(references: Reference[]): Promise<DocumentReference[]> {
    const ids: string[] = references.map<string>((ref: Reference) => ref.reference.split('/')[1]);
    return Promise.all(ids.map((id: string) => this.documentReferenceController.read(id)));
  }

  private getAttachments(references: Reference[]): Promise<Attachment[]> {
    return this.getDocRefsResources(references)
      .then((docRefs: DocumentReference[]) => docRefs.map((docRef: DocumentReference) => docRef.content.map((content: DocumentContent) => content.attachment)))
      .then((attachments: Attachment[][]) => flatten<Attachment>(attachments));
  }

  private saveChargeItemFiles(uid: string, documentPayload: DocumentPayload, files: Express.Multer.File[]): Promise<Reference[]> {
    const promises: Promise<DocumentReference>[] = files.map((file: Express.Multer.File) => {
      return this.documentReferenceController.create(uid, documentPayload, file);
    });
    return Promise.all(promises)
      .then((docRefs: DocumentReference[]) => docRefs.map((docRef: DocumentReference) => FhirResource.referenceBuilder(ResourceType.DocumentReference, docRef.id)));
  }

  private dropChargeItemDocuments(uid: string, refs: Reference[]): Promise<void> {
    const promises: Promise<'deleted' | 'archived'>[] = refs.map((ref: Reference) => ref.reference.split('/')[1])
      .map((docRefId: string) => this.documentReferenceController.delete(uid, docRefId));
    return Promise.all(promises).then(() => void 0);
  }

  private async payloadToResource(uid: string, payload: ChargeItemPayload): Promise<Partial<ChargeItem>> {
    const code: CodeableConcept = await FhirResource.codeableConceptBuilder(CodingSystem.ChargeItemType, payload.type)
      .catch((error: unknown) => {
        throw(error);
      });
    return {
      resourceType: ResourceType.ChargeItem,
      status: ChargeItemStatus.unknown,
      code,
      note: [
        {
          text: payload.note,
          time: DateTime.local().toISO(),
          authorReference: await createReference(uid)
        }
      ],
      subject: await createReference(payload.patient),
      occurrenceDateTime: payload.occurrence,
      performer: [{
        actor: await createReference(payload.performer)
      }],
      priceOverride: {
        value: payload.amount,
        currency: payload.currency
      },
      extension: [
        {
          url: ExtensionUrl.name,
          valueString: payload.name
        }
      ]
    };
  }
}
