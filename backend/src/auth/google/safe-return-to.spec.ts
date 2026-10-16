import { DEFAULT_RETURN_TO, safeReturnTo } from './safe-return-to.js';

describe('safeReturnTo', () => {
  it('keeps a path of our front, with its query', () => {
    expect(safeReturnTo('/carrito?paso=2')).toBe('/carrito?paso=2');
  });

  it('refuses other sites, written in every way that works in a browser', () => {
    for (const evil of [
      'https://evil.com',
      '//evil.com',
      '/\\evil.com',
      'javascript:alert(1)',
    ]) {
      expect(safeReturnTo(evil)).toBe(DEFAULT_RETURN_TO);
    }
  });

  it('falls back to /cuenta when there is nothing', () => {
    expect(safeReturnTo(undefined)).toBe(DEFAULT_RETURN_TO);
    expect(safeReturnTo(['/a', '/b'])).toBe(DEFAULT_RETURN_TO); // ?returnTo=/a&returnTo=/b arrives as an array
  });
});
