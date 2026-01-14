import { customError } from './custom-error';

describe('customError', () => {
  it('should work', () => {
    expect(customError()).toEqual('custom-error');
  });
});
