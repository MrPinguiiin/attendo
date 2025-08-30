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
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { UserRole } from '@prisma/client';
import { BaseResponseDto } from '../../dto/base.dto';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles(UserRole.EMPLOYEE, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Check in for work' })
  @ApiResponse({ status: 201, description: 'Check in successful' })
  async checkIn(@Body() createAttendanceDto: CreateAttendanceDto, @Request() req) {
    const result = await this.attendanceService.checkIn(createAttendanceDto, req.user);
    return BaseResponseDto.success(result, 'Check in successful');
  }

  @Post('check-out')
  @Roles(UserRole.EMPLOYEE, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Check out from work' })
  @ApiResponse({ status: 200, description: 'Check out successful' })
  async checkOut(@Body() updateAttendanceDto: UpdateAttendanceDto, @Request() req) {
    const result = await this.attendanceService.checkOut(updateAttendanceDto, req.user);
    return BaseResponseDto.success(result, 'Check out successful');
  }

  @Get()
  @ApiOperation({ summary: 'Get attendance records' })
  @ApiResponse({ status: 200, description: 'Attendance records retrieved successfully' })
  async findAll(@Query() query: any, @Request() req) {
    const result = await this.attendanceService.findAll(query, req.user);
    return BaseResponseDto.success(result, 'Attendance records retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attendance record by ID' })
  @ApiResponse({ status: 200, description: 'Attendance record retrieved successfully' })
  async findOne(@Param('id') id: string, @Request() req) {
    const result = await this.attendanceService.findOne(id, req.user);
    return BaseResponseDto.success(result, 'Attendance record retrieved successfully');
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update attendance record' })
  @ApiResponse({ status: 200, description: 'Attendance record updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @Request() req,
  ) {
    const result = await this.attendanceService.update(id, updateAttendanceDto, req.user);
    return BaseResponseDto.success(result, 'Attendance record updated successfully');
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete attendance record' })
  @ApiResponse({ status: 200, description: 'Attendance record deleted successfully' })
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.attendanceService.remove(id, req.user);
    return BaseResponseDto.success(result, 'Attendance record deleted successfully');
  }
}
