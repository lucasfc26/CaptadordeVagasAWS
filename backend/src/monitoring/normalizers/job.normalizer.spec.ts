import { JobType } from '@prisma/client';
import { normalizeJob, normalizeJobType, splitRequirements, stripHtml } from './job.normalizer';
import { ExternalJob } from '../interfaces/job-source-adapter.interface';

describe('job.normalizer', () => {
  describe('normalizeJobType', () => {
    it('maps part-time variants', () => {
      expect(normalizeJobType('part-time')).toBe(JobType.PART_TIME);
      expect(normalizeJobType('Part Time')).toBe(JobType.PART_TIME);
    });

    it('maps seasonal variants', () => {
      expect(normalizeJobType('Seasonal Employee')).toBe(JobType.SEASONAL);
    });

    it('maps temporary/reduced variants', () => {
      expect(normalizeJobType('temp')).toBe(JobType.TEMPORARY);
      expect(normalizeJobType('reduced-time')).toBe(JobType.TEMPORARY);
    });

    it('defaults to full-time', () => {
      expect(normalizeJobType('full-time')).toBe(JobType.FULL_TIME);
      expect(normalizeJobType(undefined)).toBe(JobType.FULL_TIME);
      expect(normalizeJobType('')).toBe(JobType.FULL_TIME);
    });
  });

  describe('stripHtml', () => {
    it('converts <br/> to newlines and removes tags', () => {
      expect(stripHtml('Line one<br/>Line two<br>Line three')).toBe(
        'Line one\nLine two\nLine three',
      );
    });

    it('decodes common HTML entities', () => {
      expect(stripHtml('Tom &amp; Jerry&nbsp;&quot;test&quot;')).toBe('Tom & Jerry "test"');
    });

    it('returns undefined for empty input', () => {
      expect(stripHtml(undefined)).toBeUndefined();
      expect(stripHtml('')).toBeUndefined();
    });
  });

  describe('splitRequirements', () => {
    it('splits bullet lines into a clean array', () => {
      expect(splitRequirements('- High school diploma<br/>- Lift 49 lbs<br/>')).toEqual([
        'High school diploma',
        'Lift 49 lbs',
      ]);
    });

    it('returns empty array for empty input', () => {
      expect(splitRequirements(undefined)).toEqual([]);
    });
  });

  describe('normalizeJob', () => {
    const base: ExternalJob = {
      externalId: ' 123 ',
      source: 'amazon',
      title: ' Warehouse Associate ',
      company: ' Amazon ',
      location: ' Richmond, CA ',
      city: ' Richmond ',
      state: ' CA ',
      country: ' US ',
      url: ' https://example.com/job/123 ',
      jobType: 'full-time',
      description: 'Lift up to 49 pounds<br/>Stand for long periods',
    };

    it('trims fields and derives requirements from description when not provided', () => {
      const result = normalizeJob(base);

      expect(result.externalId).toBe('123');
      expect(result.title).toBe('Warehouse Associate');
      expect(result.company).toBe('Amazon');
      expect(result.jobType).toBe(JobType.FULL_TIME);
      expect(result.requirements).toEqual(['Lift up to 49 pounds', 'Stand for long periods']);
    });

    it('prefers explicit requirements over derived ones', () => {
      const result = normalizeJob({ ...base, requirements: ['Custom requirement'] });
      expect(result.requirements).toEqual(['Custom requirement']);
    });

    it('defaults country to US when missing', () => {
      const result = normalizeJob({ ...base, country: '' });
      expect(result.country).toBe('US');
    });
  });
});
