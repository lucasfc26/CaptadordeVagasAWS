import { Injectable } from '@nestjs/common';
import {
  ExternalJob,
  JobSearchParams,
  JobSourceAdapter,
} from '../interfaces/job-source-adapter.interface';

@Injectable()
export class MockJobsAdapter implements JobSourceAdapter {
  readonly sourceName = 'mock';

  search(params: JobSearchParams): Promise<ExternalJob[]> {
    const location = params.locations[0] ?? { city: 'Richmond', state: 'CA' };

    const jobs = params.keywords.slice(0, 3).map((keyword, index) => ({
      externalId: `mock-${location.city}-${keyword}`.toLowerCase().replace(/\s+/g, '-'),
      source: this.sourceName,
      title: keyword,
      company: 'Amazon',
      location: `${location.city}, ${location.state}`,
      city: location.city,
      state: location.state,
      country: 'US',
      url: `https://www.amazon.jobs/en/jobs/mock-${index}`,
      jobType: 'full-time',
      description: `Vaga de exemplo para ${keyword} em ${location.city}.`,
      requirements: ['High school diploma', 'Able to lift up to 49 pounds'],
    }));

    return Promise.resolve(jobs);
  }
}
