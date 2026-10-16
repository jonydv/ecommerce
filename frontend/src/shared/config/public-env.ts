// The API's URL as the BROWSER sees it. NEXT_PUBLIC_ = inlined into the client bundle at build time:
// never put a secret in a NEXT_PUBLIC_ variable. The ONE place client components read it from.
export const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
