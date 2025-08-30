import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto } from './dto/leave.dto';
import { UserRole, RequestStatus } from '@prisma/client';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  async create(createLeaveRequestDto: CreateLeaveRequestDto, user: any) {
    // Check if dates are valid
    const startDate = new Date(createLeaveRequestDto.startDate);
    const endDate = new Date(createLeaveRequestDto.endDate);
    
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Cannot create leave request for past dates');
    }

    // Check if user has overlapping leave requests
    const overlappingLeave = await this.prisma.leaveRequest.findFirst({
      where: {
        userId: user.id,
        status: {
          in: [RequestStatus.PENDING, RequestStatus.APPROVED],
        },
        OR: [
          {
            startDate: {
              lte: endDate,
            },
            endDate: {
              gte: startDate,
            },
          },
        ],
      },
    });

    if (overlappingLeave) {
      throw new BadRequestException('You have overlapping leave requests for these dates');
    }

    return this.prisma.leaveRequest.create({
      data: {
        leaveType: createLeaveRequestDto.leaveType,
        startDate: new Date(createLeaveRequestDto.startDate),
        endDate: new Date(createLeaveRequestDto.endDate),
        reason: createLeaveRequestDto.reason || '',
        userId: user.id,
        companyId: user.companyId,
        status: RequestStatus.PENDING,
      },
    });
  }

  async findAll(query: any, user: any) {
    const where: any = {};

    if (user.role === UserRole.EMPLOYEE) {
      where.userId = user.id;
    } else if (user.role === UserRole.COMPANY_ADMIN) {
      where.user = {
        companyId: user.companyId,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate && query.endDate) {
      where.OR = [
        {
          startDate: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        },
        {
          endDate: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        },
      ];
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, user: any) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            companyId: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Check permissions
    if (user.role === UserRole.EMPLOYEE && leaveRequest.userId !== user.id) {
      throw new ForbiddenException('You can only view your own leave requests');
    }

    if (user.role === UserRole.COMPANY_ADMIN && leaveRequest.user.companyId !== user.companyId) {
      throw new ForbiddenException('You can only view leave requests from your company');
    }

    return leaveRequest;
  }

  async approve(id: string, user: any) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (user.role === UserRole.COMPANY_ADMIN && leaveRequest.user.companyId !== user.companyId) {
      throw new ForbiddenException('You can only approve leave requests from your company');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: RequestStatus.APPROVED,
        approvedBy: user.id,
      },
    });
  }

  async reject(id: string, reason: string, user: any) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (user.role === UserRole.COMPANY_ADMIN && leaveRequest.user.companyId !== user.companyId) {
      throw new ForbiddenException('You can only reject leave requests from your company');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        approvedBy: user.id,
        reason: reason,
      },
    });
  }

  async update(id: string, updateLeaveRequestDto: UpdateLeaveRequestDto, user: any) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (user.role === UserRole.EMPLOYEE && leaveRequest.userId !== user.id) {
      throw new ForbiddenException('You can only update your own leave requests');
    }

    if (user.role === UserRole.COMPANY_ADMIN && leaveRequest.user.companyId !== user.companyId) {
      throw new ForbiddenException('You can only update leave requests from your company');
    }

    // Only allow updates if status is PENDING
    if (leaveRequest.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Cannot update leave request that is not pending');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: updateLeaveRequestDto,
    });
  }

  async remove(id: string, user: any) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (user.role === UserRole.EMPLOYEE && leaveRequest.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own leave requests');
    }

    if (user.role === UserRole.COMPANY_ADMIN && leaveRequest.user.companyId !== user.companyId) {
      throw new ForbiddenException('You can only delete leave requests from your company');
    }

    // Only allow deletion if status is PENDING
    if (leaveRequest.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Cannot delete leave request that is not pending');
    }

    await this.prisma.leaveRequest.delete({
      where: { id },
    });

    return { message: 'Leave request deleted successfully' };
  }
}
