import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { GoogleProfile } from './google-oidc.js';

export class GoogleSignInError extends Error {
  constructor(readonly reason: 'email_not_verified' | 'no_email') {
    super(reason);
  }
}

// E2-05 · "who is this Google account in OUR database?" Three cases, in this order.
@Injectable()
export class GoogleAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async signIn(
    profile: GoogleProfile,
    retried = false,
  ): Promise<{ id: string; role: 'CUSTOMER' | 'ADMIN' }> {
    // 1 · Already linked: found by Google's `sub`, NEVER by email (the email of a Google account can change).
    const identity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_subject: { provider: 'GOOGLE', subject: profile.subject },
      },
      include: { user: { select: { id: true, role: true } } },
    });
    if (identity) {
      if (identity.email !== profile.email) {
        await this.prisma.authIdentity.update({
          where: { id: identity.id },
          data: { email: profile.email },
        });
      }
      return identity.user;
    }

    // From here on we trust the email to find or create the user, so Google must vouch for it.
    if (!profile.email) throw new GoogleSignInError('no_email');
    if (!profile.emailVerified)
      throw new GoogleSignInError('email_not_verified');
    const link = {
      create: {
        provider: 'GOOGLE' as const,
        subject: profile.subject,
        email: profile.email,
      },
    };

    try {
      const existing = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });
      if (existing) {
        // 2 · The email already has an account (registered with a password): link Google to it.
        // Our register never checked that the email was theirs. Whoever registered it might be an attacker
        // waiting for the real owner ("account pre-hijacking"). So the first link drops that unproven password:
        // from now on, only the owner of the Google account gets in.
        return await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            identities: link,
            ...(existing.emailVerifiedAt
              ? {}
              : { emailVerifiedAt: new Date(), passwordHash: null }),
          },
          select: { id: true, role: true },
        });
      }
      // 3 · New customer: an account without a password.
      return await this.prisma.user.create({
        data: {
          email: profile.email,
          emailVerifiedAt: new Date(),
          identities: link,
        },
        select: { id: true, role: true },
      });
    } catch (e: unknown) {
      // P2002: a second callback for the same person won the race (double click). Its row exists now: look again.
      if ((e as { code?: string })?.code === 'P2002' && !retried)
        return this.signIn(profile, true);
      throw e;
    }
  }
}
