import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../services/prisma.service';
import { CacheService } from '../../services/cache.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserRole, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser: any) {
    const { email, password, companyId, ...userData } = createUserDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate permissions
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      // Non-super admin can only create users for their own company
      if (!companyId || companyId !== currentUser.companyId) {
        throw new ForbiddenException('Cannot create users for other companies');
      }

      // Company admin cannot create super admin or company admin
      if (currentUser.role === UserRole.COMPANY_ADMIN &&
          (userData.role === UserRole.SUPER_ADMIN || userData.role === UserRole.COMPANY_ADMIN)) {
        throw new ForbiddenException('Insufficient permissions to create this user type');
      }
    }

    // Validate company if provided
    if (companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new BadRequestException('Invalid company ID');
      }
    } else if (userData.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Company ID is required for non-super admin users');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        email,
        password: hashedPassword,
        companyId,
      },
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

    // Cache user data
    await this.cacheService.setUser(user.id, user, 3600);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(query: any, currentUser: any) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      companyId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.UserWhereInput = {};

    // Apply tenant filtering
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.companyId = currentUser.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    }

    // Apply filters
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              registrationCode: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Remove passwords from response
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      data: usersWithoutPassword,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, currentUser: any) {
    // Try cache first
    let user = await this.cacheService.getUser(id);

    if (!user) {
      user = await this.prisma.user.findUnique({
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

      if (user) {
        await this.cacheService.setUser(id, user, 3600);
      }
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check tenant access
    if (currentUser.role !== UserRole.SUPER_ADMIN &&
        user.companyId !== currentUser.companyId) {
      throw new ForbiddenException('Access denied to this user');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: any) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check tenant access
    if (currentUser.role !== UserRole.SUPER_ADMIN &&
        existingUser.companyId !== currentUser.companyId) {
      throw new ForbiddenException('Access denied to this user');
    }

    // Validate permissions for role changes
    if (updateUserDto.role && currentUser.role !== UserRole.SUPER_ADMIN) {
      if (currentUser.role === UserRole.COMPANY_ADMIN &&
          (updateUserDto.role === UserRole.SUPER_ADMIN || updateUserDto.role === UserRole.COMPANY_ADMIN)) {
        throw new ForbiddenException('Insufficient permissions to change user role');
      }
    }

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const userWithEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (userWithEmail) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
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

    // Update cache
    await this.cacheService.setUser(id, updatedUser, 3600);

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async remove(id: string, currentUser: any) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check tenant access
    if (currentUser.role !== UserRole.SUPER_ADMIN &&
        user.companyId !== currentUser.companyId) {
      throw new ForbiddenException('Access denied to this user');
    }

    // Prevent self-deletion
    if (id === currentUser.id) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Delete user
    await this.prisma.user.delete({
      where: { id },
    });

    // Clear cache
    await this.cacheService.deleteUser(id);

    return { message: 'User deleted successfully' };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
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
  }
}
