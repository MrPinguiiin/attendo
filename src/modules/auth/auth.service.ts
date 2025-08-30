import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../services/prisma.service';
import { CacheService } from '../../services/cache.service';
import { UserPayload } from '../../interfaces';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            registrationCode: true,
            subscription: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async validateUserById(userId: string): Promise<any> {
    // Try cache first
    let user = await this.cacheService.getUser(userId);

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
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
        // Cache user data for 1 hour
        await this.cacheService.setUser(userId, user, 3600);
      }
    }

    return user;
  }

  async login(user: any) {
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store refresh token in Redis
    await this.cacheService.setSession(`refresh:${user.id}`, refreshToken, 86400); // 24 hours

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
        company: user.company,
      },
    };
  }

  async register(registerDto: any) {
    const { email, password, ...userData } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate company if provided
    if (userData.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: userData.companyId },
      });

      if (!company) {
        throw new BadRequestException('Invalid company ID');
      }

      // Check if company has active subscription (except for SUPER_ADMIN)
      if (userData.role !== UserRole.SUPER_ADMIN) {
        const subscription = await this.prisma.subscription.findUnique({
          where: { companyId: userData.companyId },
        });

        if (!subscription || subscription.status !== 'ACTIVE') {
          throw new BadRequestException('Company does not have an active subscription');
        }
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

    // Auto login after registration
    return this.login(user);
  }

  async refreshToken(refreshToken: string, userId: string) {
    // Validate refresh token
    const isValid = await this.validateRefreshToken(userId, refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user data
    const user = await this.validateUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const newAccessToken = this.generateAccessToken(payload);
    const newRefreshToken = this.generateRefreshToken(payload);

    // Update refresh token in Redis
    await this.cacheService.setSession(`refresh:${user.id}`, newRefreshToken, 86400);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Validate current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Clear user cache
    await this.cacheService.deleteUser(userId);

    return { message: 'Password changed successfully' };
  }

  async logout(userId: string) {
    // Remove refresh token from Redis
    await this.cacheService.deleteSession(`refresh:${userId}`);
    return { message: 'Logged out successfully' };
  }

  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const storedToken = await this.cacheService.getSession(`refresh:${userId}`);
    return storedToken === refreshToken;
  }

  private generateAccessToken(payload: UserPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
    });
  }

  private generateRefreshToken(payload: UserPayload): string {
    return this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        expiresIn: '7d',
        secret: this.configService.get('JWT_REFRESH_SECRET', this.configService.get('JWT_SECRET')),
      },
    );
  }
}
