import { describeApiResponse } from './api-response-shape';

describe('describeApiResponse', () => {
  it('reads fields from a jobs array', () => {
    const shape = describeApiResponse({
      jobs: [
        { title: 'Warehouse Associate', city: 'Richmond', remote: false },
        { title: 'Package Handler', city: 'San Pablo', remote: true },
      ],
    });

    expect(shape.itemPath).toBe('jobs');
    expect(shape.itemCount).toBe(2);
    expect(shape.fields.map((field) => field.path)).toEqual(expect.arrayContaining(['title', 'city', 'remote']));
    expect(shape.fields.find((field) => field.path === 'city')?.values).toEqual(['Richmond', 'San Pablo']);
    expect(shape.items[0]).toEqual({ title: 'Warehouse Associate', city: 'Richmond', remote: false });
  });

  it('prefers a jobs array over a non-list data object', () => {
    const shape = describeApiResponse({
      data: { page: 1 },
      jobs: [{ title: 'Associate', city: 'Richmond' }],
    });

    expect(shape.itemPath).toBe('jobs');
    expect(shape.itemCount).toBe(1);
  });

  it('uses the first array of objects when the payload is nested', () => {
    const shape = describeApiResponse({
      meta: { total: 1 },
      data: { results: [{ name: 'Picker', location: { city: 'Pinole' } }] },
    });

    expect(shape.itemPath).toBe('data.results');
    expect(shape.fields.some((field) => field.path === 'location.city')).toBe(true);
  });

  it('skips secret-looking keys', () => {
    const shape = describeApiResponse([{ title: 'Associate', apiKey: 'secret', token: 'abc' }]);
    expect(shape.fields.map((field) => field.path)).toEqual(['title']);
  });
});
