import { authenticate } from './authenticate';

describe('authenticate', () => {
  it('should work', () => {
    expect(authenticate()).toEqual('authenticate');
  });
});
