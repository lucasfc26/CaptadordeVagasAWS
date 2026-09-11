// ============================================
// JobWatch - Constants
// ============================================

export const APP_NAME = 'JobWatch';
export const APP_DESCRIPTION = 'Amazon Warehouse Job Monitor';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const MONITORING_FREQUENCIES = [
  { value: '5min', label: '5 minutos' },
  { value: '15min', label: '15 minutos' },
  { value: '30min', label: '30 minutos' },
  { value: '1h', label: '1 hora' },
  { value: '2h', label: '2 horas' },
  { value: '6h', label: '6 horas' },
  { value: '12h', label: '12 horas' },
  { value: '24h', label: '24 horas' },
] as const;

export const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Tempo integral' },
  { value: 'PART_TIME', label: 'Meio período' },
  { value: 'SEASONAL', label: 'Sazonal' },
  { value: 'TEMPORARY', label: 'Temporário' },
] as const;

export const NOTIFICATION_CHANNELS = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'PUSH', label: 'Push' },
  { value: 'SMS', label: 'SMS' },
] as const;

export const RADII_OPTIONS = [5, 10, 15, 25, 35, 50, 75, 100] as const;

export const REFRESH_INTERVAL = 30000; // 30 seconds for dashboard polling
