import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../generated/prisma/enums.js';
import { ROLES_KEY } from './roles.decorator.js';
import { AuthedRequest } from './session.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [
        context.getHandler(), // The method wins
        context.getClass(), // ..over the controller
      ],
    );
    if (!required?.length) return true; //No @Roles(): nothing to check
    const { user } = context.switchToHttp().getRequest<AuthedRequest>();
    if (!user) throw new UnauthorizedException(); // AuthGuard didn´t run first: a wiring bug
    return required.includes(user.role); // false -> Nest answer 403 "Forbidden resource"
  }
}
