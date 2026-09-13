import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { normalizePhone, PHONE_E164_REGEX } from '../../common/utils/phone';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Lucas Cunha' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? normalizePhone(value) : value))
  @IsString()
  @Matches(PHONE_E164_REGEX, { message: 'Informe um telefone válido com DDD' })
  phone?: string;

  @ApiPropertyOptional({ example: 'America/Los_Angeles' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
