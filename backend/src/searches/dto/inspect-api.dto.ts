import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class InspectApiDto {
  @ApiProperty({ example: 'https://api.example.com/jobs' })
  @IsString()
  @Matches(/^https?:\/\/.+/i, { message: 'Informe uma URL de API válida começando com http:// ou https://' })
  @MaxLength(2000)
  url: string;
}
