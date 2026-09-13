import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BulkDeleteDto } from '../common/dto/bulk-delete.dto';
import { JobsService } from './jobs.service';
import { JobFiltersDto } from './dto/job-filters.dto';
import { NotificationsService } from '../notifications/notifications.service';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() filters: JobFiltersDto) {
    return this.jobsService.findAllForUser(user.id, filters);
  }

  @Get('new')
  findNew(@CurrentUser() user: User, @Query() filters: JobFiltersDto) {
    return this.jobsService.findNewForUser(user.id, filters);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.jobsService.findOneForUser(user.id, id);
  }

  @Patch(':id/viewed')
  markViewed(@CurrentUser() user: User, @Param('id') id: string) {
    return this.jobsService.markViewed(user.id, id);
  }

  @Patch(':id/applied')
  markApplied(@CurrentUser() user: User, @Param('id') id: string) {
    return this.jobsService.markApplied(user.id, id);
  }

  @Patch(':id/favorite')
  toggleFavorite(@CurrentUser() user: User, @Param('id') id: string) {
    return this.jobsService.toggleFavorite(user.id, id);
  }

  @Post('bulk-delete')
  removeMany(@CurrentUser() user: User, @Body() dto: BulkDeleteDto) {
    if (dto.all) return this.jobsService.removeAllForUser(user.id);
    if (!dto.ids?.length) {
      throw new BadRequestException('Informe ids ou all=true para excluir vagas');
    }
    return this.jobsService.removeMany(user.id, dto.ids);
  }

  @Post(':id/notify-whatsapp')
  notifyWhatsapp(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.notifyJobWhatsapp(user.id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.jobsService.remove(user.id, id);
  }
}
