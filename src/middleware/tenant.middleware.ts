import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../services/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    // Skip middleware if no user (not authenticated)
    if (!user) {
      return next();
    }

    // SUPER_ADMIN can access all companies
    if (user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    // For authenticated users, ensure they have a company
    if (!user.companyId) {
      throw new ForbiddenException('User must be associated with a company');
    }

    // Validate that the company exists and is active
    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        subscription: true,
        settings: true,
      },
    });

    if (!company) {
      throw new ForbiddenException('Company not found');
    }

    // Check if company has active subscription (for non-SUPER_ADMIN users)
    if (company.subscription && company.subscription.status !== 'ACTIVE') {
      throw new ForbiddenException('Company subscription is not active');
    }

    // Add company context to request
    (req as any).company = {
      id: company.id,
      name: company.name,
      registrationCode: company.registrationCode,
      subscriptionStatus: company.subscription?.status,
      settings: company.settings,
    };

    next();
  }
}
