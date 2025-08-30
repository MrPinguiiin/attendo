import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { UserRole } from '@prisma/client';
import { BaseResponseDto } from '../../dto/base.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    const result = await this.subscriptionsService.create(createSubscriptionDto);
    return BaseResponseDto.success(result, 'Subscription created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async findAll(@Request() req) {
    const result = await this.subscriptionsService.findAll(req.user);
    return BaseResponseDto.success(result, 'Subscriptions retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  async findOne(@Param('id') id: string, @Request() req) {
    const result = await this.subscriptionsService.findOne(id, req.user);
    return BaseResponseDto.success(result, 'Subscription retrieved successfully');
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    const result = await this.subscriptionsService.update(id, updateSubscriptionDto);
    return BaseResponseDto.success(result, 'Subscription updated successfully');
  }

  @Patch(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancel(@Param('id') id: string, @Request() req) {
    const result = await this.subscriptionsService.cancel(id, req.user);
    return BaseResponseDto.success(result, 'Subscription cancelled successfully');
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete subscription' })
  @ApiResponse({ status: 200, description: 'Subscription deleted successfully' })
  async remove(@Param('id') id: string) {
    const result = await this.subscriptionsService.remove(id);
    return BaseResponseDto.success(result, 'Subscription deleted successfully');
  }
}
