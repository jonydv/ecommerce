// E2-05 · where to send the user after Google. It arrives in the query string, so anyone can write it:
// only paths of OUR front are accepted. Anything else would be an open redirect ("sign in, and land on a phishing page").
const FRONT = 'http://front.invalid'; // a fake origin, only to let URL do the parsing
export const DEFAULT_RETURN_TO = '/account';

export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/'))
    return DEFAULT_RETURN_TO;
  try {
    const url = new URL(value, FRONT); // "//evil.com" and "/\evil.com" both parse to ANOTHER origin
    return url.origin === FRONT ? url.pathname + url.search : DEFAULT_RETURN_TO;
  } catch {
    return DEFAULT_RETURN_TO;
  }
}
