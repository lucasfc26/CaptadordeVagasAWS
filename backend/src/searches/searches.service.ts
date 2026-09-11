import { Injectable, NotFoundException } from '@nestjs/common';
import { SearchStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginate } from '../common/utils/paginate';
import { MonitoringQueueService } from '../queues/monitoring-queue.service';
import { CreateSearchDto } from './dto/create-search.dto';
import { UpdateSearchDto } from './dto/update-search.dto';
import { searchToResponse, SearchWithRelations } from './searches.mapper';

const INCLUDE_RELATIONS = { keywords: true, locations: true } as const;

@Injectable()
export class SearchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monitoringQueue: MonitoringQueueService,
  ) {}

  async create(userId: string, dto: CreateSearchDto) {
    const hasPrimary = dto.locations.some((l) => l.isPrimary);

    const search = await this.prisma.search.create({
      data: {
        userId,
        name: dto.name,
        radiusMiles: dto.radiusMiles,
        frequencyMinutes: dto.frequencyMinutes,
        jobTypes: dto.jobTypes ?? [],
        notificationChannels: dto.notificationChannels,
        status: SearchStatus.ACTIVE,
        nextCheckAt: new Date(),
        keywords: { create: dto.keywords.map((value) => ({ value })) },
        locations: {
          create: dto.locations.map((location, index) => ({
            city: location.city,
            state: location.state,
            country: location.country ?? 'US',
            latitude: location.latitude,
            longitude: location.longitude,
            isPrimary: hasPrimary ? Boolean(location.isPrimary) : index === 0,
          })),
        },
      },
      include: INCLUDE_RELATIONS,
    });

    await this.monitoringQueue.scheduleSearch(search.id, 0);

    return searchToResponse(search, { jobsFound: 0, newJobsFound: 0 });
  }

  async findAllForUser(userId: string, pagination: PaginationQueryDto) {
    const where = { userId };
    const [searches, total] = await Promise.all([
      this.prisma.search.findMany({
        where,
        include: INCLUDE_RELATIONS,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.search.count({ where }),
    ]);

    const data = await Promise.all(
      searches.map(async (search) =>
        searchToResponse(search, await this.getStats(search.id, userId)),
      ),
    );

    return paginate(data, total, pagination.page, pagination.limit);
  }

  async findOneForUser(userId: string, id: string) {
    const search = await this.getOwnedOrThrow(userId, id);
    return searchToResponse(search, await this.getStats(id, userId));
  }

  async update(userId: string, id: string, dto: UpdateSearchDto) {
    await this.getOwnedOrThrow(userId, id);

    const search = await this.prisma.search.update({
      where: { id },
      data: {
        name: dto.name,
        radiusMiles: dto.radiusMiles,
        frequencyMinutes: dto.frequencyMinutes,
        jobTypes: dto.jobTypes,
        notificationChannels: dto.notificationChannels,
        ...(dto.keywords && {
          keywords: {
            deleteMany: {},
            create: dto.keywords.map((value) => ({ value })),
          },
        }),
        ...(dto.locations && {
          locations: {
            deleteMany: {},
            create: dto.locations.map((location, index) => ({
              city: location.city,
              state: location.state,
              country: location.country ?? 'US',
              latitude: location.latitude,
              longitude: location.longitude,
              isPrimary: dto.locations!.some((l) => l.isPrimary)
                ? Boolean(location.isPrimary)
                : index === 0,
            })),
          },
        }),
      },
      include: INCLUDE_RELATIONS,
    });

    return searchToResponse(search, await this.getStats(id, userId));
  }

  async remove(userId: string, id: string) {
    await this.getOwnedOrThrow(userId, id);
    await this.monitoringQueue.cancelSearch(id);
    await this.prisma.search.delete({ where: { id } });
  }

  async pause(userId: string, id: string) {
    await this.getOwnedOrThrow(userId, id);
    const search = await this.prisma.search.update({
      where: { id },
      data: { status: SearchStatus.PAUSED, nextCheckAt: null },
      include: INCLUDE_RELATIONS,
    });
    await this.monitoringQueue.cancelSearch(id);
    return searchToResponse(search, await this.getStats(id, userId));
  }

  async resume(userId: string, id: string) {
    await this.getOwnedOrThrow(userId, id);
    const search = await this.prisma.search.update({
      where: { id },
      data: { status: SearchStatus.ACTIVE, nextCheckAt: new Date() },
      include: INCLUDE_RELATIONS,
    });
    await this.monitoringQueue.scheduleSearch(id, 0);
    return searchToResponse(search, await this.getStats(id, userId));
  }

  async history(userId: string, id: string, pagination: PaginationQueryDto) {
    await this.getOwnedOrThrow(userId, id);

    const where = { searchId: id };
    const [executions, total] = await Promise.all([
      this.prisma.monitoringExecution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.monitoringExecution.count({ where }),
    ]);

    return paginate(executions, total, pagination.page, pagination.limit);
  }

  private async getOwnedOrThrow(userId: string, id: string): Promise<SearchWithRelations> {
    const search = await this.prisma.search.findUnique({
      where: { id },
      include: INCLUDE_RELATIONS,
    });

    if (!search || search.userId !== userId) {
      throw new NotFoundException('Busca não encontrada');
    }

    return search;
  }

  private async getStats(searchId: string, userId: string) {
    const [jobsFound, newJobsFound] = await Promise.all([
      this.prisma.job.count({ where: { jobSearches: { some: { searchId } } } }),
      this.prisma.job.count({
        where: {
          jobSearches: { some: { searchId } },
          isActive: true,
          jobUserStates: { none: { userId, viewedAt: { not: null } } },
        },
      }),
    ]);

    return { jobsFound, newJobsFound };
  }
}
