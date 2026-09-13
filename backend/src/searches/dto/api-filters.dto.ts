import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class ApiFilterDto {
  @ApiProperty({ example: 'city' })
  @IsString()
  @MaxLength(200)
  path: string;

  @ApiProperty({ type: [String], example: ['Richmond', 'San Pablo'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  values: string[];
}

export class ApiFiltersDto {
  @ApiPropertyOptional({ example: 'jobs' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  itemPath?: string;

  @ApiProperty({ type: [ApiFilterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApiFilterDto)
  filters: ApiFilterDto[];
}
