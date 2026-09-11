import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { paginate } from '../common/utils/paginate';
import { JobFiltersDto, JobSortBy, JobStatusFilter } from './dto/job-filters.dto';
import { jobToResponse, JobWithRelations } from './jobs.mapper';

const INCLUDE_RELATIONS = { jobSearches: true, jobUserStates: true } as const;

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string, filters: JobFiltersDto) {
    const where = this.buildWhere(userId, filters);
    const orderBy = this.buildOrderBy(filters.sortBy);

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: INCLUDE_RELATIONS,
        orderBy,
        skip: filters.skip,
        take: filters.limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    const data = jobs.map((job) => jobToResponse(job, userId));
    return paginate(data, total, filters.page, filters.limit);
  }

  async findNewForUser(userId: string, filters: JobFiltersDto) {
    filters.onlyNew = 'true';
    return this.findAllForUser(userId, filters);
  }

  async findOneForUser(userId: string, id: string) {
    const job = await this.getOwnedOrThrow(userId, id);
    return jobToResponse(job, userId);
  }

  async markViewed(userId: string, id: string) {
    await this.getOwnedOrThrow(userId, id);
    await this.prisma.jobUserState.upsert({
      where: { jobId_userId: { jobId: id, userId } },
      create: { jobId: id, userId, viewedAt: new Date() },
      update: { viewedAt: new Date() },
    });
    return this.findOneForUser(userId, id);
  }

  async markApplied(userId: string, id: string) {
    await this.getOwnedOrThrow(userId, id);
    await this.prisma.jobUserState.upsert({
      where: { jobId_userId: { jobId: id, userId } },
      create: { jobId: id, userId, viewedAt: new Date(), appliedAt: new Date() },
      update: { appliedAt: new Date() },
    });
    return this.findOneForUser(userId, id);
  }

  async toggleFavorite(userId: string, id: string) {
    await this.getOwnedOrThrow(userId, id);
    const current = await this.prisma.jobUserState.findUnique({
      where: { jobId_userId: { jobId: id, userId } },
    });

    await this.prisma.jobUserState.upsert({
      where: { jobId_userId: { jobId: id, userId } },
      create: { jobId: id, userId, favorite: true },
      update: { favorite: !current?.favorite },
    });
    return this.findOneForUser(userId, id);
  }

  private async getOwnedOrThrow(userId: string, id: string): Promise<JobWithRelations> {
    const job = await this.prisma.job.findFirst({
      where: { id, jobSearches: { some: { search: { userId } } } },
      include: INCLUDE_RELATIONS,
    });

    if (!job) {
      throw new NotFoundException('Vaga não encontrada');
    }

    return job;
  }

  private buildWhere(userId: string, filters: JobFiltersDto): Prisma.JobWhereInput {
    const conditions: Prisma.JobWhereInput[] = [{ jobSearches: { some: { search: { userId } } } }];

    if (filters.searchId) {
      conditions.push({ jobSearches: { some: { searchId: filters.searchId } } });
    }

    if (filters.title) {
      conditions.push({ title: { contains: filters.title, mode: 'insensitive' } });
    }

    if (filters.location) {
      conditions.push({
        OR: [
          { city: { contains: filters.location, mode: 'insensitive' } },
          { state: { contains: filters.location, mode: 'insensitive' } },
          { location: { contains: filters.location, mode: 'insensitive' } },
        ],
      });
    }

    if (filters.jobType) {
      conditions.push({ jobType: filters.jobType });
    }

    if (filters.onlyNew === 'true') {
      conditions.push({
        isActive: true,
        jobUserStates: { none: { userId, viewedAt: { not: null } } },
      });
    }

    if (filters.status) {
      conditions.push(this.buildStatusCondition(filters.status, userId));
    }

    return { AND: conditions };
  }

  // Mirrors the NEW/VIEWED/APPLIED/EXPIRED precedence in jobs.mapper.ts's
  // resolveStatus, so filtering by status matches what the client sees.
  private buildStatusCondition(status: JobStatusFilter, userId: string): Prisma.JobWhereInput {
    switch (status) {
      case JobStatusFilter.APPLIED:
        return { jobUserStates: { some: { userId, appliedAt: { not: null } } } };
      case JobStatusFilter.EXPIRED:
        return {
          isActive: false,
          jobUserStates: { none: { userId, appliedAt: { not: null } } },
        };
      case JobStatusFilter.VIEWED:
        return {
          isActive: true,
          jobUserStates: { some: { userId, viewedAt: { not: null }, appliedAt: null } },
        };
      case JobStatusFilter.NEW:
      default:
        return {
          isActive: true,
          jobUserStates: { none: { userId, viewedAt: { not: null } } },
        };
    }
  }

  private buildOrderBy(sortBy: JobSortBy): Prisma.JobOrderByWithRelationInput {
    switch (sortBy) {
      case JobSortBy.OLDEST:
        return { firstSeenAt: 'asc' };
      case JobSortBy.LOCATION:
        return { city: 'asc' };
      case JobSortBy.TITLE:
        return { title: 'asc' };
      case JobSortBy.NEWEST:
      default:
        return { firstSeenAt: 'desc' };
    }
  }
}
