import { Injectable } from '@nestjs/common';
import { SearchStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { jobToResponse } from '../jobs/jobs.mapper';
import { searchToResponse } from '../searches/searches.mapper';

const NEW_JOBS_LIMIT = 10;
const ACTIVE_SEARCHES_LIMIT = 10;
const RECENT_ACTIVITY_LIMIT = 10;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const [
      activeSearchesCount,
      availableJobs,
      newJobsCount,
      checkpoints,
      newJobs,
      activeSearches,
      recentActivity,
    ] = await Promise.all([
      this.prisma.search.count({ where: { userId, status: SearchStatus.ACTIVE } }),
      this.prisma.job.count({
        where: { isActive: true, jobSearches: { some: { search: { userId } } } },
      }),
      this.prisma.job.count({
        where: {
          isActive: true,
          jobSearches: { some: { search: { userId } } },
          jobUserStates: { none: { userId, viewedAt: { not: null } } },
        },
      }),
      this.getCheckpoints(userId),
      this.prisma.job.findMany({
        where: {
          isActive: true,
          jobSearches: { some: { search: { userId } } },
          jobUserStates: { none: { userId, viewedAt: { not: null } } },
        },
        include: { jobSearches: true, jobUserStates: true },
        orderBy: { firstSeenAt: 'desc' },
        take: NEW_JOBS_LIMIT,
      }),
      this.prisma.search.findMany({
        where: { userId, status: SearchStatus.ACTIVE },
        include: { keywords: true, locations: true },
        orderBy: { updatedAt: 'desc' },
        take: ACTIVE_SEARCHES_LIMIT,
      }),
      this.prisma.monitoringExecution.findMany({
        where: { search: { userId } },
        orderBy: { createdAt: 'desc' },
        take: RECENT_ACTIVITY_LIMIT,
        include: { search: { select: { name: true } } },
      }),
    ]);

    const activeSearchesWithStats = await Promise.all(
      activeSearches.map(async (search) => {
        const [jobsFound, newJobsFound] = await Promise.all([
          this.prisma.job.count({ where: { jobSearches: { some: { searchId: search.id } } } }),
          this.prisma.job.count({
            where: {
              jobSearches: { some: { searchId: search.id } },
              isActive: true,
              jobUserStates: { none: { userId, viewedAt: { not: null } } },
            },
          }),
        ]);
        return searchToResponse(search, { jobsFound, newJobsFound });
      }),
    );

    return {
      stats: {
        newJobs: newJobsCount,
        availableJobs,
        activeSearches: activeSearchesCount,
      },
      monitoringActive: activeSearchesCount > 0,
      lastCheckedAt: checkpoints.lastCheckedAt,
      nextCheckAt: checkpoints.nextCheckAt,
      newJobs: newJobs.map((job) => jobToResponse(job, userId)),
      activeSearches: activeSearchesWithStats,
      recentActivity: recentActivity.map((execution) => ({
        id: execution.id,
        searchId: execution.searchId,
        searchName: execution.search.name,
        status: execution.status,
        jobsFound: execution.jobsFound,
        newJobsFound: execution.newJobs,
        errorMessage: execution.errorMessage ?? undefined,
        executedAt: execution.createdAt,
      })),
    };
  }

  private async getCheckpoints(userId: string) {
    const [last, next] = await Promise.all([
      this.prisma.search.findFirst({
        where: { userId, lastCheckedAt: { not: null } },
        orderBy: { lastCheckedAt: 'desc' },
        select: { lastCheckedAt: true },
      }),
      this.prisma.search.findFirst({
        where: { userId, status: SearchStatus.ACTIVE, nextCheckAt: { not: null } },
        orderBy: { nextCheckAt: 'asc' },
        select: { nextCheckAt: true },
      }),
    ]);

    return {
      lastCheckedAt: last?.lastCheckedAt ?? undefined,
      nextCheckAt: next?.nextCheckAt ?? undefined,
    };
  }
}
