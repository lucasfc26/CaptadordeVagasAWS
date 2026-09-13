// ============================================
// JobWatch - Search <-> Backend DTO mapping
//
// The backend stores locations as structured {city, state} rows and
// frequency as minutes; the UI works with a single "City, ST" string plus
// a list of additional city names and a frequency label ('1h', '30min'...).
// These helpers translate between the two without touching the form UI.
// ============================================

import type { ApiFilters, JobType, MonitoringFrequency, NotificationChannel, SearchSourceType, WarehouseFilters } from '@/types';

const FREQUENCY_TO_MINUTES: Record<MonitoringFrequency, number> = {
  '5min': 5,
  '15min': 15,
  '30min': 30,
  '1h': 60,
  '2h': 120,
  '6h': 360,
  '12h': 720,
  '24h': 1440,
};

export function frequencyToMinutes(frequency: string): number {
  return FREQUENCY_TO_MINUTES[frequency as MonitoringFrequency] ?? 60;
}

const MINUTES_TO_FREQUENCY: Record<number, MonitoringFrequency> = Object.fromEntries(
  Object.entries(FREQUENCY_TO_MINUTES).map(([label, minutes]) => [minutes, label]),
) as Record<number, MonitoringFrequency>;

export function minutesToFrequency(minutes: number): MonitoringFrequency {
  return MINUTES_TO_FREQUENCY[minutes] ?? '1h';
}

export function parseLocation(location: string): { city: string; state: string } {
  const [city, state] = location.split(',').map((part) => part.trim());
  return { city: city || location.trim(), state: state || '' };
}

export interface BackendSearchLocation {
  city: string;
  state: string;
  isPrimary?: boolean;
}

export function buildLocationsPayload(
  location: string,
  additionalCities: string[],
): BackendSearchLocation[] {
  const primary = parseLocation(location);
  const additional = additionalCities.map((city) => ({ city, state: primary.state }));
  return [{ ...primary, isPrimary: true }, ...additional];
}

export interface SearchFormPayload {
  name: string;
  sourceType: SearchSourceType;
  targetUrl?: string;
  xpath?: string;
  apiFilters?: ApiFilters;
  warehouseFilters?: WarehouseFilters;
  location: string;
  radius: number;
  keywords: string[];
  jobTypes: JobType[];
  additionalCities: string[];
  frequency: string;
  notificationChannels: NotificationChannel[];
}

export function isCustomSearchSource(sourceType: SearchSourceType) {
  return sourceType === 'JOB_API' || sourceType === 'JOB_XPATH';
}

export function isWarehouseSearchSource(sourceType: SearchSourceType) {
  return sourceType === 'AMAZON_WAREHOUSE';
}

export function toCreateSearchDto(data: SearchFormPayload) {
  const custom = isCustomSearchSource(data.sourceType);
  const warehouse = isWarehouseSearchSource(data.sourceType);
  return {
    name: data.name,
    sourceType: data.sourceType,
    targetUrl: data.targetUrl,
    xpath: data.xpath,
    apiFilters: data.apiFilters,
    warehouseFilters: data.warehouseFilters,
    keywords: custom
      ? [data.targetUrl || data.name]
      : warehouse
        ? [data.warehouseFilters?.zipCode || data.name]
        : data.keywords,
    locations: custom
      ? [{ city: 'Custom', state: '—', isPrimary: true }]
      : warehouse
        ? [{ city: data.warehouseFilters?.zipCode || data.location, state: 'US', isPrimary: true }]
        : buildLocationsPayload(data.location, data.additionalCities),
    radiusMiles: data.radius,
    frequencyMinutes: frequencyToMinutes(data.frequency),
    jobTypes: data.jobTypes,
    notificationChannels: data.notificationChannels,
  };
}

export function toUpdateSearchDto(data: Partial<SearchFormPayload>) {
  return {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.keywords !== undefined && { keywords: data.keywords }),
    ...(data.location !== undefined && {
      locations: buildLocationsPayload(data.location, data.additionalCities ?? []),
    }),
    ...(data.radius !== undefined && { radiusMiles: data.radius }),
    ...(data.frequency !== undefined && { frequencyMinutes: frequencyToMinutes(data.frequency) }),
    ...(data.jobTypes !== undefined && { jobTypes: data.jobTypes }),
    ...(data.notificationChannels !== undefined && {
      notificationChannels: data.notificationChannels,
    }),
  };
}
