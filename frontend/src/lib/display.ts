import { JOB_TYPES, MONITORING_FREQUENCIES, SEARCH_SOURCES } from '@/lib/constants';
import type { Job, JobType, MonitoringFrequency, NotificationChannel, NotificationType, SearchSourceType } from '@/types';

export function facilityCode(facility?: string): string {
  if (!facility) return 'AMZN';
  const match = facility.match(/\b([A-Z]{2,5}\d{1,2})\b/);
  if (match) return match[1];
  return facility.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || 'AMZN';
}

export function searchSourceLabel(type?: SearchSourceType): string {
  return SEARCH_SOURCES.find((item) => item.value === type)?.label ?? 'Amazon Jobs';
}

export function jobTypeLabel(type: JobType): string {
  return JOB_TYPES.find((item) => item.value === type)?.label ?? type;
}

export function frequencyLabel(frequency: MonitoringFrequency): string {
  return MONITORING_FREQUENCIES.find((item) => item.value === frequency)?.label ?? frequency;
}

export function frequencyShort(frequency: MonitoringFrequency): string {
  const map: Record<MonitoringFrequency, string> = {
    '5min': '5 min',
    '15min': '15 min',
    '30min': '30 min',
    '1h': '1h',
    '2h': '2h',
    '6h': '6h',
    '12h': '12h',
    '24h': '24h',
  };
  return map[frequency];
}

export function jobLocation(job: Job): string {
  const cityState = [job.location.city, job.location.state].filter(Boolean).join(', ');
  const place = job.location.address || cityState;
  return job.facility ? `${job.facility}${place ? ` — ${place}` : ''}` : place;
}

export function formatPay(salary?: string): string {
  const text = (salary || '').trim();
  if (!text) return 'A consultar';
  return text.replace(/^pay\s*rate:?\s*/i, '').replace(/^up\s*to\s*/i, 'Até ').trim();
}

export function jobMapQuery(job: Job): string {
  return job.location.address || [job.location.city, job.location.state].filter(Boolean).join(', ');
}

export function googleMapsEmbedUrl(query: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&hl=en&output=embed`;
}

export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function channelLabel(channel: NotificationChannel): string {
  const map: Record<NotificationChannel, string> = {
    EMAIL: 'Email',
    WHATSAPP: 'WhatsApp',
    PUSH: 'Push',
    SMS: 'SMS',
  };
  return map[channel];
}

export function notificationTypeLabel(type: NotificationType): string {
  const map: Record<NotificationType, string> = {
    NEW_JOB: 'Nova vaga encontrada',
    MONITORING_ERROR: 'Erro no monitoramento',
    MONITORING_PAUSED: 'Monitoramento pausado',
    SUMMARY: 'Resumo periódico',
  };
  return map[type];
}

export function notificationIcon(type: NotificationType): string {
  const map: Record<NotificationType, string> = {
    NEW_JOB: 'work',
    MONITORING_ERROR: 'error',
    MONITORING_PAUSED: 'pause_circle',
    SUMMARY: 'summarize',
  };
  return map[type];
}
