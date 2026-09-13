import {
  buildWhatsappTemplateComponents,
  buildWhatsappTextBody,
  isWhatsappSessionWindowError,
  sanitizeWhatsappTemplateText,
} from './whatsapp-payload';

describe('whatsapp-payload', () => {
  const payload = {
    to: '15105551234',
    title: 'Nova vaga: Warehouse Associate',
    message: 'Amazon · Richmond, CA',
    jobUrl: 'https://hiring.amazon.com/jobs/123',
  };

  it('joins title, message and url for session text messages', () => {
    expect(buildWhatsappTextBody(payload)).toContain('Warehouse Associate');
    expect(buildWhatsappTextBody(payload)).toContain('hiring.amazon.com');
  });

  it('detects Cloud API 24h-window errors', () => {
    expect(isWhatsappSessionWindowError('(#131047) Re-engagement message')).toBe(true);
    expect(isWhatsappSessionWindowError('Invalid OAuth access token')).toBe(false);
  });

  it('omits template body components when no params are configured', () => {
    expect(buildWhatsappTemplateComponents(payload, [])).toEqual([]);
  });

  it('maps named template params and flattens whitespace', () => {
    const [body] = buildWhatsappTemplateComponents(payload, ['title', 'url']);
    expect(body.parameters).toEqual([
      { type: 'text', text: 'Nova vaga: Warehouse Associate' },
      { type: 'text', text: 'https://hiring.amazon.com/jobs/123' },
    ]);
    expect(sanitizeWhatsappTemplateText('  a \n\n b  ')).toBe('a b');
  });
});
