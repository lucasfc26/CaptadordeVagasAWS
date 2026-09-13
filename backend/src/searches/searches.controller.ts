import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SearchesService } from './searches.service';
import { InspectApiService } from './inspect-api.service';
import { CreateSearchDto } from './dto/create-search.dto';
import { InspectApiDto } from './dto/inspect-api.dto';
import { UpdateSearchDto } from './dto/update-search.dto';

@ApiTags('searches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('searches')
export class SearchesController {
  constructor(
    private readonly searchesService: SearchesService,
    private readonly inspectApiService: InspectApiService,
  ) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateSearchDto) {
    return this.searchesService.create(user.id, dto);
  }

  @Post('inspect-api')
  inspectApi(@Body() dto: InspectApiDto) {
    return this.inspectApiService.inspect(dto.url);
  }

  @Post('run-now')
  runNow(@CurrentUser() user: User) {
    return this.searchesService.runNow(user.id);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationQueryDto) {
    return this.searchesService.findAllForUser(user.id, pagination);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.searchesService.findOneForUser(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateSearchDto) {
    return this.searchesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.searchesService.remove(user.id, id);
  }

  @Post(':id/pause')
  pause(@CurrentUser() user: User, @Param('id') id: string) {
    return this.searchesService.pause(user.id, id);
  }

  @Post(':id/resume')
  resume(@CurrentUser() user: User, @Param('id') id: string) {
    return this.searchesService.resume(user.id, id);
  }

  @Get(':id/history')
  history(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.searchesService.history(user.id, id, pagination);
  }
}
