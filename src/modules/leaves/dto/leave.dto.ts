import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class CreateLeaveRequestDto {
  @ApiProperty({ enum: LeaveType, example: LeaveType.ANNUAL_LEAVE })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-17' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Family vacation', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeaveRequestDto {
  @ApiProperty({ enum: LeaveType, example: LeaveType.ANNUAL_LEAVE, required: false })
  @IsOptional()
  @IsEnum(LeaveType)
  leaveType?: LeaveType;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-01-17', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 'Family vacation', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
