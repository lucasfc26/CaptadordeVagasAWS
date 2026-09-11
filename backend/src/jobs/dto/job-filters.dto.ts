import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export enum JobSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  LOCATION = 'location',
  TITLE = 'title',
}

export enum JobStatusFilter {
  NEW = 'NEW',
  VIEWED = 'VIEWED',
  APPLIED = 'APPLIED',
  EXPIRED = 'EXPIRED',
}

export class JobFiltersDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: JobStatusFilter })
  @IsOptional()
  @IsEnum(JobStatusFilter)
  status?: JobStatusFilter;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: JobType })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  onlyNew?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  searchId?: string;

  @ApiPropertyOptional({ enum: JobSortBy, default: JobSortBy.NEWEST })
  @IsOptional()
  @IsEnum(JobSortBy)
  @Transform(({ value }: { value?: string }) => value ?? JobSortBy.NEWEST)
  sortBy: JobSortBy = JobSortBy.NEWEST;
}
