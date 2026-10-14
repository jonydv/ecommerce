import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashPassword, normalizeEmail, verifyPassword } from './credentials.js';
import { randomBytes } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './session.js';

@Injectable()
export class AuthService {
  private readonly dummyHash = hashPassword(randomBytes(32).toString('hex'));
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(rawEmail: string, password: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(rawEmail) },
    });
    const ok = await verifyPassword(
      user?.passwordHash ?? (await this.dummyHash),
      password,
    );
    if (!user || !ok) throw new UnauthorizedException('invalid credentials'); // SAME message
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return this.jwt.signAsync(payload);
  }

  me(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, createdAt: true },
    });
  }

  async register(rawEmail: string, password: string): Promise<void> {
    const email = normalizeEmail(rawEmail);
    const passwordHash = await hashPassword(password);
    try {
      await this.prisma.user.create({ data: { email, passwordHash } });
    } catch (e: unknown) {
      // P2002 = unique. Swallowed ON PURPOSE: E1's filter would turn it into a 409 = enumerator.
      if ((e as { code?: string })?.code !== 'P2002') throw e; // duck typing, as in SPIKES N3
    }
  }
}
