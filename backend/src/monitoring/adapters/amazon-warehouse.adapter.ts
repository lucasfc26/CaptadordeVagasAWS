import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import {
  ExternalJob,
  JobSearchParams,
  JobSourceAdapter,
} from '../interfaces/job-source-adapter.interface';

interface ExtractorJob {
  externalId?: string;
  title?: string;
  url?: string;
  location?: string;
  city?: string;
  state?: string;
  jobType?: string;
  salary?: string;
  schedule?: string;
}

@Injectable()
export class AmazonWarehouseAdapter implements JobSourceAdapter {
  readonly sourceName = 'amazon-warehouse';
  private readonly logger = new Logger(AmazonWarehouseAdapter.name);

  constructor(private readonly config: AppConfigService) {}

  async search(params: JobSearchParams): Promise<ExternalJob[]> {
    const filters = params.warehouseFilters;
    if (!filters?.zipCode) {
      throw new Error('Amazon Warehouse exige zipCode');
    }

    const baseUrl = this.config.warehouseExtractorUrl;
    if (!baseUrl) {
      throw new ServiceUnavailableException(
        'WAREHOUSE_EXTRACTOR_URL não configurada para o fluxo de hiring.amazon.com',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/extract`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          zipCode: filters.zipCode,
          workHours: filters.workHours,
          schedule: filters.schedule ?? [],
          length: filters.length,
          whenStart: filters.whenStart,
          jobTitle: filters.jobTitle,
          employmentType: filters.employmentType,
          payRateMin: filters.payRateMin,
          payRateMax: filters.payRateMax,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Extrator Warehouse respondeu ${response.status}: ${detail.slice(0, 280)}`);
      }

      const payload = (await response.json()) as { jobs?: ExtractorJob[] };
      return (payload.jobs ?? [])
        .filter((job) => job.title && job.url && /jobId=/i.test(job.url))
        .map((job) => this.toExternalJob(job));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('O extrator de Amazon Warehouse excedeu o tempo limite');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private toExternalJob(job: ExtractorJob): ExternalJob {
    return {
      externalId: job.externalId || job.url || job.title || 'warehouse-job',
      source: this.sourceName,
      title: job.title || 'Amazon Warehouse',
      company: 'Amazon',
      location: job.location || [job.city, job.state].filter(Boolean).join(', '),
      city: job.city || job.location || '',
      state: job.state || '',
      country: 'US',
      url: job.url || '',
      jobType: job.jobType,
      salary: job.salary,
      schedule: job.schedule,
    };
  }
}
