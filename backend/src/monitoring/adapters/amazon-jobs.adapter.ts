import { Injectable, Logger } from '@nestjs/common';
import {
  ExternalJob,
  JobSearchParams,
  JobSourceAdapter,
} from '../interfaces/job-source-adapter.interface';
import { splitRequirements } from '../normalizers/job.normalizer';

/**
 * Amazon's hourly "Warehouse Associate" postings live on hiring.amazon.com,
 * which sits behind a CloudFront/WAF bot-mitigation layer that blocks plain
 * HTTP requests (verified: even a bare GET to "/" returns 403). Bypassing
 * that protection would mean evading an anti-bot control, which this adapter
 * deliberately does not attempt.
 *
 * Instead this adapter targets amazon.jobs' own public search endpoint
 * (the JSON API amazon.jobs' website itself calls, no auth/keys required).
 * It mostly lists corporate/professional roles but does include some
 * operations/fulfillment postings. Its `loc_query`/`radius`/`lat`+`lng`
 * parameters were verified NOT to filter results server-side (confirmed by
 * probing: results included jobs worldwide regardless of those params), so
 * this adapter fetches by keyword only and applies its own city/state
 * filtering client-side instead of trusting the API's geo params.
 *
 * If a compliant source for the hourly fulfillment-center postings becomes
 * available (an official feed/partner API), swap it in here — the rest of
 * the system only depends on the JobSourceAdapter interface.
 */
const SEARCH_URL = 'https://www.amazon.jobs/en/search.json';
const REQUEST_TIMEOUT_MS = 15_000;
const RESULT_LIMIT = 50;
const MAX_PAGES_PER_KEYWORD = 2;
const DELAY_BETWEEN_REQUESTS_MS = 400;

interface AmazonApiJob {
  id_icims: string;
  title: string;
  company_name: string;
  location: string;
  city: string;
  state: string;
  country_code: string;
  job_path: string;
  job_schedule_type?: string;
  description?: string;
  description_short?: string;
  basic_qualifications?: string;
  preferred_qualifications?: string;
}

interface AmazonApiResponse {
  error: string | null;
  hits: number;
  jobs: AmazonApiJob[];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class AmazonJobsAdapter implements JobSourceAdapter {
  readonly sourceName = 'amazon';
  private readonly logger = new Logger(AmazonJobsAdapter.name);

  async search(params: JobSearchParams): Promise<ExternalJob[]> {
    const targetStates = new Set(params.locations.map((l) => l.state.toLowerCase()));
    const targetCities = new Set(params.locations.map((l) => l.city.toLowerCase()));

    const matches = new Map<string, ExternalJob>();

    for (const keyword of params.keywords) {
      const keywordLower = keyword.toLowerCase();

      try {
        let offset = 0;
        for (let page = 0; page < MAX_PAGES_PER_KEYWORD; page++) {
          const { jobs, hits } = await this.fetchPage(keyword, offset);

          for (const job of jobs) {
            const titleMatches = job.title.toLowerCase().includes(keywordLower);
            const locationMatches =
              targetStates.has(job.state?.toLowerCase()) ||
              targetCities.has(job.city?.toLowerCase());

            if (titleMatches && locationMatches) {
              const external = this.toExternalJob(job);
              matches.set(external.externalId, external);
            }
          }

          offset += RESULT_LIMIT;
          await sleep(DELAY_BETWEEN_REQUESTS_MS);
          if (offset >= hits || jobs.length === 0) break;
        }
      } catch (error) {
        this.logger.warn(`Falha ao consultar Amazon Jobs para "${keyword}": ${String(error)}`);
      }
    }

    return Array.from(matches.values());
  }

  private async fetchPage(
    baseQuery: string,
    offset: number,
  ): Promise<{ jobs: AmazonApiJob[]; hits: number }> {
    const url = new URL(SEARCH_URL);
    url.searchParams.set('base_query', baseQuery);
    url.searchParams.set('result_limit', String(RESULT_LIMIT));
    url.searchParams.set('offset', String(offset));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobWatchBot/1.0; +https://jobwatch.example.com)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as AmazonApiResponse;
      if (data.error) {
        throw new Error(data.error);
      }

      return { jobs: data.jobs, hits: data.hits };
    } finally {
      clearTimeout(timeout);
    }
  }

  private toExternalJob(job: AmazonApiJob): ExternalJob {
    const requirements = splitRequirements(
      [job.basic_qualifications, job.preferred_qualifications].filter(Boolean).join('\n'),
    );

    return {
      externalId: job.id_icims,
      source: this.sourceName,
      title: job.title,
      company: job.company_name || 'Amazon',
      location: job.location,
      city: job.city,
      state: job.state,
      country: job.country_code === 'USA' ? 'US' : job.country_code,
      url: `https://www.amazon.jobs${job.job_path}`,
      jobType: job.job_schedule_type,
      description: job.description || job.description_short,
      requirements,
    };
  }
}
