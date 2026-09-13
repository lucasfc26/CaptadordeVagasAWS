import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobType, NotificationChannel, SearchSourceType } from '@prisma/client';
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
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ALLOWED_FREQUENCY_MINUTES } from '../../common/constants/monitoring-frequency';
import { ApiFiltersDto } from './api-filters.dto';
import { SearchLocationDto } from './search-location.dto';
import { WarehouseFiltersDto } from './warehouse-filters.dto';

const SKIP_AMAZON_JOBS_FIELDS: SearchSourceType[] = [
  SearchSourceType.JOB_API,
  SearchSourceType.JOB_XPATH,
  SearchSourceType.AMAZON_WAREHOUSE,
];

function skipsAmazonJobsFields(sourceType?: SearchSourceType) {
  return sourceType ? SKIP_AMAZON_JOBS_FIELDS.includes(sourceType) : false;
}

export class CreateSearchDto {
  @ApiProperty({ example: 'Amazon Warehouse — Richmond' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ enum: SearchSourceType, default: SearchSourceType.AMAZON_JOBS })
  @IsOptional()
  @IsEnum(SearchSourceType)
  sourceType?: SearchSourceType;

  @ApiPropertyOptional({ example: 'https://www.amazon.jobs/en/jobs/123' })
  @ValidateIf((value) => skipsAmazonJobsFields(value.sourceType) && value.sourceType !== SearchSourceType.AMAZON_WAREHOUSE)
  @IsString()
  @Matches(/^https?:\/\/.+/i, { message: 'Informe uma URL válida começando com http:// ou https://' })
  @MaxLength(2000)
  targetUrl?: string;

  @ApiPropertyOptional({ example: '//div[@class="job-card"]' })
  @ValidateIf((value) => value.sourceType === SearchSourceType.JOB_XPATH)
  @IsString()
  @MaxLength(2000)
  xpath?: string;

  @ApiPropertyOptional({ type: ApiFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ApiFiltersDto)
  apiFilters?: ApiFiltersDto;

  @ApiPropertyOptional({ type: WarehouseFiltersDto })
  @ValidateIf((value) => value.sourceType === SearchSourceType.AMAZON_WAREHOUSE)
  @ValidateNested()
  @Type(() => WarehouseFiltersDto)
  warehouseFilters?: WarehouseFiltersDto;

  @ApiProperty({ type: [String], example: ['Warehouse Associate', 'Fulfillment Center'] })
  @ValidateIf((value) => !skipsAmazonJobsFields(value.sourceType))
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  keywords: string[];

  @ApiProperty({ type: [SearchLocationDto] })
  @ValidateIf((value) => !skipsAmazonJobsFields(value.sourceType))
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
