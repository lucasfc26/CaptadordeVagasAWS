import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const WAREHOUSE_SCHEDULES = [
  'Early morning',
  'Daytime',
  'Evening',
  'Night',
  'Weekday',
  'Weekend',
] as const;

export const WAREHOUSE_LENGTHS = ['Regular', 'Seasonal'] as const;

export const WAREHOUSE_EMPLOYMENT_TYPES = ['Flex Time', 'Full Time', 'Both'] as const;

export const WAREHOUSE_STARTS = [
  'As soon as possible',
  'Within 1-2 weeks',
  'Within 2-5 weeks',
  'After 3 weeks',
] as const;

export class WarehouseFiltersDto {
  @ApiProperty({ example: '94547' })
  @IsString()
  @MaxLength(120)
  zipCode: string;

  @ApiPropertyOptional({ example: 20, minimum: 0, maximum: 40 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(40)
  workHours?: number;

  @ApiPropertyOptional({ enum: WAREHOUSE_SCHEDULES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(WAREHOUSE_SCHEDULES, { each: true })
  schedule?: string[];

  @ApiPropertyOptional({ enum: WAREHOUSE_LENGTHS })
  @IsOptional()
  @IsIn(WAREHOUSE_LENGTHS)
  length?: string;

  @ApiPropertyOptional({ enum: WAREHOUSE_STARTS })
  @IsOptional()
  @IsIn(WAREHOUSE_STARTS)
  whenStart?: string;

  @ApiPropertyOptional({ example: 'Warehouse Associate' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiPropertyOptional({ enum: WAREHOUSE_EMPLOYMENT_TYPES, default: 'Both' })
  @IsOptional()
  @IsIn(WAREHOUSE_EMPLOYMENT_TYPES)
  employmentType?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  payRateMin?: number;

  @ApiPropertyOptional({ example: 100, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  payRateMax?: number;
}
