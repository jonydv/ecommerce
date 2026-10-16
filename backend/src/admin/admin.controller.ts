import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser, type AuthUser } from '../auth/session.js';
import { Role } from '../generated/prisma/enums.js';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard) // order matters: who are you → what can you do
@Roles(Role.ADMIN)
export class AdminController {
  @Get('ping')
  ping(@CurrentUser() user: AuthUser) {
    return { pong: true, userId: user.id, role: user.role };
  }
}
