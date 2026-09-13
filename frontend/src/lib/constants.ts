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
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'PUSH', label: 'Push' },
  { value: 'SMS', label: 'SMS' },
] as const;

export const RADII_OPTIONS = [5, 10, 15, 25, 35, 50, 75, 100] as const;

export const SEARCH_SOURCES = [
  {
    value: 'AMAZON_JOBS',
    label: 'Amazon Jobs',
    description: 'Monitora vagas corporativas e operacionais no amazon.jobs.',
    icon: 'work',
  },
  {
    value: 'AMAZON_WAREHOUSE',
    label: 'Amazon Warehouse',
    description: 'Percorre o assistente do hiring.amazon.com com CEP, horas, escala e início.',
    icon: 'warehouse',
  },
  {
    value: 'JOB_API',
    label: 'Job API',
    description: 'Lê uma API de vagas e monta filtros a partir da resposta.',
    icon: 'api',
  },
  {
    value: 'JOB_XPATH',
    label: 'Job XPath',
    description: 'Extrai vagas de uma página usando um seletor XPath.',
    icon: 'code',
  },
] as const;

export const WAREHOUSE_HOURS = [
  { value: '', label: 'Qualquer carga horária' },
  { value: '10', label: '10 horas' },
  { value: '20', label: '20 horas' },
  { value: '30', label: '30 horas' },
  { value: '40', label: '40+ horas' },
] as const;

export const WAREHOUSE_SCHEDULES = [
  { value: 'Early morning', label: 'Early morning' },
  { value: 'Daytime', label: 'Daytime' },
  { value: 'Evening', label: 'Evening' },
  { value: 'Night', label: 'Night' },
  { value: 'Weekday', label: 'Weekday' },
  { value: 'Weekend', label: 'Weekend' },
] as const;

export const WAREHOUSE_LENGTHS = [
  { value: '', label: 'Qualquer duração' },
  { value: 'Regular', label: 'Regular (mais de 3 meses)' },
  { value: 'Seasonal', label: 'Seasonal (até 3 meses)' },
] as const;

export const WAREHOUSE_EMPLOYMENT_TYPES = [
  { value: 'Both', label: 'Both (Flex Time e Full Time)' },
  { value: 'Flex Time', label: 'Flex Time' },
  { value: 'Full Time', label: 'Full Time' },
] as const;

export const WAREHOUSE_STARTS = [
  { value: '', label: 'Qualquer início' },
  { value: 'As soon as possible', label: 'As soon as possible' },
  { value: 'Within 1-2 weeks', label: 'Within 1-2 weeks' },
  { value: 'Within 2-5 weeks', label: 'Within 2-5 weeks' },
  { value: 'After 3 weeks', label: 'After 3 weeks' },
] as const;

export const REFRESH_INTERVAL = 30000; // 30 seconds for dashboard polling
