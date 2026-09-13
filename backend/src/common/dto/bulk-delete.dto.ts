import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class BulkDeleteDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  all?: boolean;
}
