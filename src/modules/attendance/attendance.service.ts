import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import { UserRole, AttendanceStatus, WorkLocationType } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(createAttendanceDto: CreateAttendanceDto, user: any) {
    // Check if user already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        userId: user.id,
        clockInTime: {
          gte: today,
        },
      },
    });

    if (existingAttendance) {
      throw new BadRequestException('Already checked in today');
    }

    const clockInTime = new Date();
    let status = AttendanceStatus.PRESENT;

    return this.prisma.attendance.create({
      data: {
        userId: user.id,
        clockInTime,
        clockInLatitude: createAttendanceDto.latitude || 0,
        clockInLongitude: createAttendanceDto.longitude || 0,
        clockInPhotoUrl: 'default-photo.jpg', // This should be handled by file upload
        status,
        workLocation: createAttendanceDto.workLocationType,
        activityReport: createAttendanceDto.notes,
      },
    });
  }

  async checkOut(updateAttendanceDto: UpdateAttendanceDto, user: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        userId: user.id,
        clockInTime: {
          gte: today,
        },
        clockOutTime: null,
      },
    });

    if (!attendance) {
      throw new NotFoundException('No active attendance record found');
    }

    const clockOutTime = new Date();

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOutTime,
        clockOutLatitude: updateAttendanceDto.latitude || 0,
        clockOutLongitude: updateAttendanceDto.longitude || 0,
        activityReport: updateAttendanceDto.notes,
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

    if (query.startDate && query.endDate) {
      where.clockInTime = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    return this.prisma.attendance.findMany({
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
        clockInTime: 'desc',
      },
    });
  }

  async findOne(id: string, user: any) {
    const attendance = await this.prisma.attendance.findUnique({
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

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    // Check permissions
    if (user.role === UserRole.EMPLOYEE && attendance.userId !== user.id) {
      throw new ForbiddenException('You can only view your own attendance records');
    }

    if (user.role === UserRole.COMPANY_ADMIN && attendance.user.companyId !== user.companyId) {
      throw new ForbiddenException('You can only view attendance records from your company');
    }

    return attendance;
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto, user: any) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    if (user.role === UserRole.COMPANY_ADMIN && attendance.user.companyId !== user.companyId) {
      throw new ForbiddenException('You can only update attendance records from your company');
    }

    const updateData: any = {};
    if (updateAttendanceDto.notes) {
      updateData.activityReport = updateAttendanceDto.notes;
    }

    return this.prisma.attendance.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, user: any) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    if (user.role === UserRole.COMPANY_ADMIN && attendance.user.companyId !== user.companyId) {
      throw new ForbiddenException('You can only delete attendance records from your company');
    }

    await this.prisma.attendance.delete({
      where: { id },
    });

    return { message: 'Attendance record deleted successfully' };
  }
}
