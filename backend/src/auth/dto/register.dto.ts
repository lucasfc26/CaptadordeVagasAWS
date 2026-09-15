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

  @ApiProperty({ example: '+5585987149385' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizePhone(value) : value))
  @IsString()
  @Matches(PHONE_E164_REGEX, {
    message: 'Informe um WhatsApp válido com DDI (ex.: +5585987149385 ou +15105551234)',
  })
  phone: string;

  @ApiProperty({ example: 'strong-password-123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
