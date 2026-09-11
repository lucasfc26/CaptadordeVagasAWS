import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobType, NotificationChannel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ALLOWED_FREQUENCY_MINUTES } from '../../common/constants/monitoring-frequency';
import { SearchLocationDto } from './search-location.dto';

export class CreateSearchDto {
  @ApiProperty({ example: 'Amazon Warehouse — Richmond' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ type: [String], example: ['Warehouse Associate', 'Fulfillment Center'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  keywords: string[];

  @ApiProperty({ type: [SearchLocationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SearchLocationDto)
  locations: SearchLocationDto[];

  @ApiProperty({ example: 25, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  radiusMiles: number;

  @ApiProperty({ example: 60, enum: ALLOWED_FREQUENCY_MINUTES })
  @IsInt()
  @IsIn(ALLOWED_FREQUENCY_MINUTES)
  frequencyMinutes: number;

  @ApiPropertyOptional({ enum: JobType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(JobType, { each: true })
  jobTypes?: JobType[];

  @ApiProperty({ enum: NotificationChannel, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(NotificationChannel, { each: true })
  notificationChannels: NotificationChannel[];
}
