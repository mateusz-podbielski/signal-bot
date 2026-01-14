import { mailer } from './mailer';

describe('mailer', () => {
  it('should work', () => {
    expect(mailer()).toEqual('mailer');
  });
});
