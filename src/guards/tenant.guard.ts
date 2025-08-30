import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../services/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip if no user
    if (!user) {
      return true;
    }

    // SUPER_ADMIN can access everything
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check if user belongs to a company
    if (!user.companyId) {
      throw new ForbiddenException('Access denied: User must be associated with a company');
    }

    // Get company from request (should be set by TenantMiddleware)
    const company = request.company;
    if (!company) {
      throw new ForbiddenException('Access denied: Company context not found');
    }

    // Additional role-based checks can be added here
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        throw new ForbiddenException('Access denied: Insufficient permissions');
      }
    }

    return true;
  }
}
