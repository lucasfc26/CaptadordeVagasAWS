import { JobType } from '@prisma/client';
import { jobToResponse, JobWithRelations } from './jobs.mapper';

function buildJob(overrides: Partial<JobWithRelations> = {}): JobWithRelations {
  return {
    id: 'job-1',
    externalId: 'ext-1',
    source: 'amazon',
    title: 'Warehouse Associate',
    company: 'Amazon',
    location: 'Richmond, CA',
    city: 'Richmond',
    state: 'CA',
    country: 'US',
    url: 'https://example.com/job',
    jobType: JobType.FULL_TIME,
    description: null,
    requirements: [],
    benefits: [],
    salary: null,
    schedule: null,
    firstSeenAt: new Date('2026-01-01T00:00:00Z'),
    lastSeenAt: new Date('2026-01-01T00:00:00Z'),
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    jobSearches: [{ id: 'js-1', jobId: 'job-1', searchId: 'search-1', createdAt: new Date() }],
    jobUserStates: [],
    ...overrides,
  };
}

describe('jobToResponse', () => {
  it('marks a job with no user state as NEW', () => {
    const response = jobToResponse(buildJob(), 'user-1');
    expect(response.status).toBe('NEW');
  });

  it('marks a job as VIEWED when the user has viewed it', () => {
    const job = buildJob({
      jobUserStates: [
        {
          id: 'jus-1',
          jobId: 'job-1',
          userId: 'user-1',
          viewedAt: new Date(),
          appliedAt: null,
          favorite: false,
        },
      ],
    });
    expect(jobToResponse(job, 'user-1').status).toBe('VIEWED');
  });

  it('marks a job as APPLIED when the user has applied, even if inactive', () => {
    const job = buildJob({
      isActive: false,
      jobUserStates: [
        {
          id: 'jus-1',
          jobId: 'job-1',
          userId: 'user-1',
          viewedAt: new Date(),
          appliedAt: new Date(),
          favorite: false,
        },
      ],
    });
    expect(jobToResponse(job, 'user-1').status).toBe('APPLIED');
  });

  it('marks an inactive, unapplied job as EXPIRED', () => {
    const job = buildJob({ isActive: false });
    expect(jobToResponse(job, 'user-1').status).toBe('EXPIRED');
  });

  it('ignores another user state when resolving status', () => {
    const job = buildJob({
      jobUserStates: [
        {
          id: 'jus-1',
          jobId: 'job-1',
          userId: 'other-user',
          viewedAt: new Date(),
          appliedAt: new Date(),
          favorite: false,
        },
      ],
    });
    expect(jobToResponse(job, 'user-1').status).toBe('NEW');
  });
});
