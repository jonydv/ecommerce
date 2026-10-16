// E2-05 · a LINK, not fetch: the browser has to NAVIGATE to Nest, which sends it to Google's screen and back.
// No 'use client': it's plain HTML, it works even before React loads.
import { PUBLIC_API_URL } from '@/shared/config/public-env';
const API = PUBLIC_API_URL;

export function GoogleButton({ returnTo = '/account' }: { returnTo?: string }) {
  return (
    <a
      href={`${API}/auth/google?returnTo=${encodeURIComponent(returnTo)}`}
      className='flex max-w-sm items-center justify-center gap-2 border p-2'
    >
      Continuar con Google
    </a>
  );
}

// What Nest puts in /login?error=… when Google didn't work out
export const GOOGLE_ERRORS: Record<string, string> = {
  google_cancelled: 'Cancelaste el ingreso con Google.',
  email_not_verified: 'Tu cuenta de Google no tiene el email verificado.',
  no_email: 'Google no nos dio tu email.',
  google_unavailable: 'El ingreso con Google no está configurado.',
  google_failed: 'No pudimos entrar con Google. Probá de nuevo.',
};
