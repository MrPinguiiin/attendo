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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto } from './dto/leave.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { UserRole } from '@prisma/client';
import { BaseResponseDto } from '../../dto/base.dto';

@ApiTags('Leaves')
@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create leave request' })
  @ApiResponse({ status: 201, description: 'Leave request created successfully' })
  async create(@Body() createLeaveRequestDto: CreateLeaveRequestDto, @Request() req) {
    const result = await this.leavesService.create(createLeaveRequestDto, req.user);
    return BaseResponseDto.success(result, 'Leave request created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get leave requests' })
  @ApiResponse({ status: 200, description: 'Leave requests retrieved successfully' })
  async findAll(@Query() query: any, @Request() req) {
    const result = await this.leavesService.findAll(query, req.user);
    return BaseResponseDto.success(result, 'Leave requests retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get leave request by ID' })
  @ApiResponse({ status: 200, description: 'Leave request retrieved successfully' })
  async findOne(@Param('id') id: string, @Request() req) {
    const result = await this.leavesService.findOne(id, req.user);
    return BaseResponseDto.success(result, 'Leave request retrieved successfully');
  }

  @Patch(':id/approve')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Approve leave request' })
  @ApiResponse({ status: 200, description: 'Leave request approved successfully' })
  async approve(@Param('id') id: string, @Request() req) {
    const result = await this.leavesService.approve(id, req.user);
    return BaseResponseDto.success(result, 'Leave request approved successfully');
  }

  @Patch(':id/reject')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Reject leave request' })
  @ApiResponse({ status: 200, description: 'Leave request rejected successfully' })
  async reject(@Param('id') id: string, @Body() rejectDto: { reason: string }, @Request() req) {
    const result = await this.leavesService.reject(id, rejectDto.reason, req.user);
    return BaseResponseDto.success(result, 'Leave request rejected successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update leave request' })
  @ApiResponse({ status: 200, description: 'Leave request updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateLeaveRequestDto: UpdateLeaveRequestDto,
    @Request() req,
  ) {
    const result = await this.leavesService.update(id, updateLeaveRequestDto, req.user);
    return BaseResponseDto.success(result, 'Leave request updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete leave request' })
  @ApiResponse({ status: 200, description: 'Leave request deleted successfully' })
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.leavesService.remove(id, req.user);
    return BaseResponseDto.success(result, 'Leave request deleted successfully');
  }
}
