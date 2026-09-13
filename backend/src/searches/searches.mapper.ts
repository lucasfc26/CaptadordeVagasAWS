import type { Search, SearchKeyword, SearchLocation } from '@prisma/client';

const MINUTES_TO_LABEL: Record<number, string> = {
  5: '5min',
  10: '10min',
  15: '15min',
  30: '30min',
  60: '1h',
  120: '2h',
  360: '6h',
  720: '12h',
  1440: '24h',
};

export function frequencyMinutesToLabel(minutes: number): string {
  return MINUTES_TO_LABEL[minutes] ?? `${minutes}min`;
}

export type SearchWithRelations = Search & {
  keywords: SearchKeyword[];
  locations: SearchLocation[];
};

export interface SearchStats {
  jobsFound: number;
  newJobsFound: number;
}

export function searchToResponse(search: SearchWithRelations, stats: SearchStats) {
  const primary = search.locations.find((l) => l.isPrimary) ?? search.locations[0];
  const additionalCities = search.locations.filter((l) => l !== primary).map((l) => l.city);

  return {
    id: search.id,
    userId: search.userId,
    name: search.name,
    sourceType: search.sourceType,
    targetUrl: search.targetUrl,
    xpath: search.xpath,
    apiFilters: search.apiFilters,
    warehouseFilters: search.warehouseFilters,
    location: primary ? `${primary.city}, ${primary.state}` : '',
    radius: search.radiusMiles,
    keywords: search.keywords.map((k) => k.value),
    jobTypes: search.jobTypes,
    additionalCities,
    frequency: frequencyMinutesToLabel(search.frequencyMinutes),
    notificationChannels: search.notificationChannels,
    status: search.status,
    lastCheckedAt: search.lastCheckedAt,
    nextCheckAt: search.nextCheckAt,
    jobsFound: stats.jobsFound,
    newJobsFound: stats.newJobsFound,
    createdAt: search.createdAt,
    updatedAt: search.updatedAt,
  };
}
