export interface ApiResponseField {
  path: string;
  type: 'string' | 'number' | 'boolean' | 'mixed';
  values: string[];
  uniqueCount: number;
}

export interface ApiResponseShape {
  itemPath: string;
  itemCount: number;
  fields: ApiResponseField[];
  items: Record<string, unknown>[];
}

const PREFERRED_ARRAY_KEYS = ['jobs', 'data', 'results', 'items', 'listings', 'records', 'vacancies', 'content'];
const SKIP_KEYS = /password|secret|token|authorization|apikey|api_key|cookie|ssn/i;
const MAX_DEPTH = 3;
const MAX_ITEMS = 80;
const MAX_SAMPLE_ITEMS = 12;
const MAX_VALUES = 24;
const MAX_FIELDS = 24;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function primitiveType(value: unknown): ApiResponseField['type'] | null {
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number' && Number.isFinite(value)) return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return null;
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function findItemArray(
  value: unknown,
  path = '',
  depth = 0,
): { path: string; items: Record<string, unknown>[] } | null {
  if (depth > 4) return null;

  if (Array.isArray(value)) {
    const items = value.filter(isRecord).slice(0, MAX_ITEMS);
    if (items.length > 0) {
      return { path: path || '$', items };
    }
    return null;
  }

  if (!isRecord(value)) return null;

  for (const key of PREFERRED_ARRAY_KEYS) {
    if (key in value) {
      const found = findItemArray(value[key], path ? `${path}.${key}` : key, depth + 1);
      if (found) return found;
    }
  }

  for (const [key, child] of Object.entries(value)) {
    if (PREFERRED_ARRAY_KEYS.includes(key)) continue;
    const found = findItemArray(child, path ? `${path}.${key}` : key, depth + 1);
    if (found) return found;
  }

  if (depth === 0) {
    return { path: path || '$', items: [value] };
  }
  return null;
}

function slimItem(record: Record<string, unknown>): Record<string, unknown> {
  const slim: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SKIP_KEYS.test(key)) continue;
    const type = primitiveType(value);
    if (type) {
      slim[key] = value;
      continue;
    }
    if (isRecord(value)) {
      const nested: Record<string, unknown> = {};
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (SKIP_KEYS.test(nestedKey)) continue;
        if (primitiveType(nestedValue)) nested[nestedKey] = nestedValue;
      }
      if (Object.keys(nested).length > 0) slim[key] = nested;
    }
  }
  return slim;
}

function collectFromObject(
  record: Record<string, unknown>,
  prefix: string,
  depth: number,
  buckets: Map<string, { types: Set<ApiResponseField['type']>; values: Set<string> }>,
) {
  if (depth > MAX_DEPTH) return;

  for (const [key, value] of Object.entries(record)) {
    if (SKIP_KEYS.test(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const type = primitiveType(value);
    if (type) {
      const bucket = buckets.get(path) ?? { types: new Set(), values: new Set() };
      bucket.types.add(type);
      if (bucket.values.size < MAX_VALUES) {
        const text = stringifyValue(value).trim();
        if (text && text.length <= 80) bucket.values.add(text);
      }
      buckets.set(path, bucket);
      continue;
    }
    if (isRecord(value)) {
      collectFromObject(value, path, depth + 1, buckets);
    }
  }
}

export function describeApiResponse(payload: unknown): ApiResponseShape {
  const found = findItemArray(payload);
  if (!found) {
    throw new Error('A API não retornou uma lista de itens para montar filtros');
  }

  const buckets = new Map<string, { types: Set<ApiResponseField['type']>; values: Set<string> }>();
  for (const item of found.items) {
    collectFromObject(item, '', 1, buckets);
  }

  const fields = [...buckets.entries()]
    .slice(0, MAX_FIELDS)
    .map(([path, bucket]) => {
      const types = [...bucket.types];
      return {
        path,
        type: types.length === 1 ? types[0] : 'mixed',
        values: [...bucket.values].sort((a, b) => a.localeCompare(b)),
        uniqueCount: bucket.values.size,
      };
    });

  if (fields.length === 0) {
    throw new Error('Não foi possível identificar campos na resposta da API');
  }

  return {
    itemPath: found.path,
    itemCount: found.items.length,
    fields,
    items: found.items.slice(0, MAX_SAMPLE_ITEMS).map(slimItem),
  };
}
