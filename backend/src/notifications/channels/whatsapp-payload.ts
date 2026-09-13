import type { NotificationPayload } from './notification-channel.interface';

const SESSION_WINDOW_ERROR =
  /131047|131026|131051|24\s*hour|re-engagement|not in allowed window|outside the allowed window/i;

export function buildWhatsappTextBody(payload: NotificationPayload): string {
  return [payload.title, payload.message, payload.jobUrl].filter(Boolean).join('\n\n');
}

export function isWhatsappSessionWindowError(errorBody: string): boolean {
  return SESSION_WINDOW_ERROR.test(errorBody);
}

export function sanitizeWhatsappTemplateText(value: string): string {
  const cleaned = value.replace(/\s+/g, ' ').trim().slice(0, 1024);
  return cleaned || '-';
}

export function buildWhatsappTemplateComponents(
  payload: NotificationPayload,
  paramKeys: string[],
): Array<{ type: 'body'; parameters: Array<{ type: 'text'; text: string }> }> {
  if (!paramKeys.length) {
    return [];
  }

  const values: Record<string, string> = {
    title: payload.title,
    message: payload.message,
    url: payload.jobUrl ?? payload.message,
  };

  return [
    {
      type: 'body',
      parameters: paramKeys.map((key) => ({
        type: 'text',
        text: sanitizeWhatsappTemplateText(values[key] ?? payload.title),
      })),
    },
  ];
}
