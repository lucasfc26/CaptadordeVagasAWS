import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BulkDeleteDto } from '../common/dto/bulk-delete.dto';
import { NotificationsService } from './notifications.service';
import { NotificationFiltersDto } from './dto/notification-filters.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() filters: NotificationFiltersDto) {
    return this.notificationsService.findAllForUser(user.id, filters);
  }

  @Post('bulk-delete')
  removeMany(@CurrentUser() user: User, @Body() dto: BulkDeleteDto) {
    if (dto.all) return this.notificationsService.removeAllForUser(user.id);
    if (!dto.ids?.length) {
      throw new BadRequestException('Informe ids ou all=true para excluir notificações');
    }
    return this.notificationsService.removeMany(user.id, dto.ids);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.remove(user.id, id);
  }
}
