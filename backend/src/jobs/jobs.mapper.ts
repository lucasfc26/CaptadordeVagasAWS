import type { Job, JobSearch, JobUserState } from '@prisma/client';

export type JobWithRelations = Job & {
  jobSearches: JobSearch[];
  jobUserStates: JobUserState[];
};

export type JobStatusLabel = 'NEW' | 'VIEWED' | 'APPLIED' | 'EXPIRED';

function resolveStatus(job: JobWithRelations, userState?: JobUserState): JobStatusLabel {
  if (userState?.appliedAt) return 'APPLIED';
  if (!job.isActive) return 'EXPIRED';
  if (userState?.viewedAt) return 'VIEWED';
  return 'NEW';
}

export function jobToResponse(job: JobWithRelations, userId: string) {
  const userState = job.jobUserStates.find((s) => s.userId === userId);

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    facility: job.company,
    location: { city: job.city, state: job.state },
    jobType: job.jobType,
    description: job.description ?? undefined,
    requirements: job.requirements,
    benefits: job.benefits,
    salary: job.salary ?? undefined,
    schedule: job.schedule ?? undefined,
    externalUrl: job.url,
    status: resolveStatus(job, userState),
    searchId: job.jobSearches[0]?.searchId,
    foundAt: job.firstSeenAt,
    viewedAt: userState?.viewedAt ?? undefined,
    appliedAt: userState?.appliedAt ?? undefined,
  };
}
