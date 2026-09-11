import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Lucas Cunha' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'lucas@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strong-password-123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
