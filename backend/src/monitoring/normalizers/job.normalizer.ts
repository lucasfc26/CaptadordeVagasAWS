import { JobType } from '@prisma/client';
import { ExternalJob } from '../interfaces/job-source-adapter.interface';

export interface NormalizedJob {
  externalId: string;
  source: string;
  title: string;
  company: string;
  location: string;
  city: string;
  state: string;
  country: string;
  url: string;
  jobType: JobType;
  description?: string;
  requirements: string[];
  benefits: string[];
  salary?: string;
  schedule?: string;
}

export function stripHtml(value?: string): string | undefined {
  if (!value) return undefined;
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

export function splitRequirements(value?: string): string[] {
  const clean = stripHtml(value);
  if (!clean) return [];
  return clean
    .split('\n')
    .map((line) => line.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);
}

export function normalizeJobType(raw?: string): JobType {
  const value = (raw ?? '').toLowerCase();
  if (value.includes('part')) return JobType.PART_TIME;
  if (value.includes('season')) return JobType.SEASONAL;
  if (value.includes('temp') || value.includes('reduced')) return JobType.TEMPORARY;
  return JobType.FULL_TIME;
}

export function normalizeJob(external: ExternalJob): NormalizedJob {
  return {
    externalId: external.externalId.trim(),
    source: external.source,
    title: external.title.trim(),
    company: external.company.trim(),
    location: external.location.trim(),
    city: external.city.trim(),
    state: external.state.trim(),
    country: external.country.trim() || 'US',
    url: external.url.trim(),
    jobType: normalizeJobType(external.jobType),
    description: stripHtml(external.description),
    requirements: external.requirements?.length
      ? external.requirements
      : splitRequirements(external.description),
    benefits: external.benefits ?? [],
    salary: external.salary,
    schedule: external.schedule,
  };
}
