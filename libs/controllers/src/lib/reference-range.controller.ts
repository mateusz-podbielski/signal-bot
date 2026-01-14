import { DBReferenceRange, Gender, ObservationType } from '@signalbot-backend/interfaces';
import { ReferenceRangeModel } from '@signalbot-backend/schemas';

export class ReferenceRangeController {
  public create(data: Partial<DBReferenceRange>): Promise<DBReferenceRange> {
    return ReferenceRangeModel.create(data);
  }

  public readAll(type: ObservationType, gender: Gender): Promise<DBReferenceRange[]> {
    return ReferenceRangeModel.find({ type, appliesTo: gender }).exec();
  }
}
