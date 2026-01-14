import { JwtHelper } from './jwt-helper';

describe('JWT Helper', () => {
  it('sign should generate the JWT', () => {
    const token = JwtHelper.sign({test: 'test'});
    expect(token.split('.')).toHaveLength(3);
    expect(token).toBeTruthy();
  })
});
