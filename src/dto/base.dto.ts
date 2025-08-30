import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class IdDto {
  @ApiProperty()
  @IsString()
  id: string;
}

export class BaseResponseDto<T = any> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data?: T;

  @ApiProperty({ required: false })
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };

  constructor(success: boolean, message: string, data?: T, meta?: any) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  static success<T>(data: T, message = 'Success'): BaseResponseDto<T> {
    return new BaseResponseDto(true, message, data);
  }

  static successWithMeta<T>(
    data: T,
    meta: any,
    message = 'Success'
  ): BaseResponseDto<T> {
    return new BaseResponseDto(true, message, data, meta);
  }

  static error(message = 'Error'): BaseResponseDto {
    return new BaseResponseDto(false, message);
  }
}
