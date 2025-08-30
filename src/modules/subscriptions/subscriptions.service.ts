import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { UserRole, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    // Check if company already has an active subscription
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        companyId: createSubscriptionDto.companyId,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
        },
      },
    });

    if (existingSubscription) {
      throw new BadRequestException('Company already has an active subscription');
    }

    // Validate plan exists
    const plan = await this.prisma.plan.findUnique({
      where: { id: createSubscriptionDto.planId },
    });

    if (!plan) {
      throw new BadRequestException('Invalid plan ID');
    }

    return this.prisma.subscription.create({
      data: createSubscriptionDto,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            registrationCode: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            maxUsers: true,
            features: true,
          },
        },
      },
    });
  }

  async findAll(user: any) {
    const where: any = {};

    if (user.role === UserRole.COMPANY_ADMIN) {
      where.companyId = user.companyId;
    }

    return this.prisma.subscription.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            registrationCode: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            maxUsers: true,
            features: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, user: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            registrationCode: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            maxUsers: true,
            features: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Check permissions
    if (user.role === UserRole.COMPANY_ADMIN && subscription.companyId !== user.companyId) {
      throw new ForbiddenException('You can only view subscriptions from your company');
    }

    return subscription;
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.subscription.update({
      where: { id },
      data: updateSubscriptionDto,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            registrationCode: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            maxUsers: true,
            features: true,
          },
        },
      },
    });
  }

  async cancel(id: string, user: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            registrationCode: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Check permissions
    if (user.role === UserRole.COMPANY_ADMIN && subscription.companyId !== user.companyId) {
      throw new ForbiddenException('You can only cancel subscriptions from your company');
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELED,
        endDate: new Date(),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            registrationCode: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            maxUsers: true,
            features: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.subscription.delete({
      where: { id },
    });

    return { message: 'Subscription deleted successfully' };
  }
}
