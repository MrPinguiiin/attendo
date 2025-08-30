import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: createCompanyDto,
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
        settings: true,
        officeLocations: true,
        shifts: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, user: any) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if user has permission to update this company
    if (user.role === UserRole.COMPANY_ADMIN && user.companyId !== id) {
      throw new ForbiddenException('You can only update your own company');
    }

    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async remove(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Delete related data first
    await this.prisma.$transaction([
      this.prisma.user.deleteMany({ where: { companyId: id } }),
      this.prisma.subscription.deleteMany({ where: { companyId: id } }),
      this.prisma.companySettings.deleteMany({ where: { companyId: id } }),
      this.prisma.officeLocation.deleteMany({ where: { companyId: id } }),
      this.prisma.shift.deleteMany({ where: { companyId: id } }),
      this.prisma.company.delete({ where: { id } }),
    ]);

    return { message: 'Company deleted successfully' };
  }
}
