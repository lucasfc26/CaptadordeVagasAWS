export interface JobSearchLocationParams {
  city: string;
  state: string;
  country?: string;
}

export interface WarehouseSearchFilters {
  zipCode: string;
  workHours?: number;
  schedule?: string[];
  length?: string;
  whenStart?: string;
  jobTitle?: string;
  employmentType?: string;
  payRateMin?: number;
  payRateMax?: number;
}

export interface JobSearchParams {
  keywords: string[];
  locations: JobSearchLocationParams[];
  radiusMiles: number;
  warehouseFilters?: WarehouseSearchFilters;
}

export interface ExternalJob {
  externalId: string;
  source: string;
  title: string;
  company: string;
  location: string;
  city: string;
  state: string;
  country: string;
  url: string;
  jobType?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  salary?: string;
  schedule?: string;
}

export const JOB_SOURCE_ADAPTER = 'JOB_SOURCE_ADAPTER';

export interface JobSourceAdapter {
  readonly sourceName: string;
  search(params: JobSearchParams): Promise<ExternalJob[]>;
}
