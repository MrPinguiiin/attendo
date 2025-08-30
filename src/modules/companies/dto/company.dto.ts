import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Demo Company' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Jl. Demo No. 123, Jakarta', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '+62-21-12345678', required: false })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({ example: 'DEMO001' })
  @IsString()
  registrationCode: string;
}

export class UpdateCompanyDto {
  @ApiProperty({ example: 'Demo Company', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Jl. Demo No. 123, Jakarta', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '+62-21-12345678', required: false })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}
