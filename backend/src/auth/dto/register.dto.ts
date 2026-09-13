import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { normalizePhone, PHONE_E164_REGEX } from '../../common/utils/phone';

export class RegisterDto {
  @ApiProperty({ example: 'Lucas Cunha' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'lucas@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: '11999999999' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizePhone(value) : value))
  @IsString()
  @Matches(PHONE_E164_REGEX, { message: 'Informe um telefone válido com DDD' })
  phone: string;

  @ApiProperty({ example: 'strong-password-123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
