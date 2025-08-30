import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { WorkLocationType } from '@prisma/client';

export class CreateAttendanceDto {
  @ApiProperty({ enum: WorkLocationType, example: WorkLocationType.WFO })
  @IsEnum(WorkLocationType)
  workLocationType: WorkLocationType;

  @ApiProperty({ example: -6.2088, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 106.8456, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 'Working from office', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAttendanceDto {
  @ApiProperty({ example: 'Finished work for today', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: -6.2088, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 106.8456, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
