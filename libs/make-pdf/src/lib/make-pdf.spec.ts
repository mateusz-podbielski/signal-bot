import { makePdf } from './make-pdf';

describe('makePdf', () => {
  it('should work', () => {
    expect(makePdf()).toEqual('make-pdf');
  });
});
