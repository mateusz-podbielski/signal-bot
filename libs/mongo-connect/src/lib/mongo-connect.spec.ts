import { mongoConnect } from './mongo-connect';

describe('mongoConnect', () => {
  it('should work', () => {
    expect(mongoConnect()).toEqual('mongo-connect');
  });
});
