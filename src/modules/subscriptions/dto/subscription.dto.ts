import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'company-id-here' })
  @IsString()
  companyId: string;

  @ApiProperty({ example: 'plan-id-here' })
  @IsString()
  planId: string;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE })
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: '2024-01-31', required: false })
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;
}

export class UpdateSubscriptionDto {
  @ApiProperty({ example: 'plan-id-here', required: false })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: '2024-01-31', required: false })
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;
}
