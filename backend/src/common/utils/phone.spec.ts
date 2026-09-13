import { isValidPhone, normalizePhone, toWhatsappRecipient } from './phone';

describe('phone', () => {
  it('normalizes Brazilian mobiles with and without country code', () => {
    expect(normalizePhone('11999999999')).toBe('+5511999999999');
    expect(normalizePhone('(11) 99999-9999')).toBe('+5511999999999');
    expect(normalizePhone('+55 11 99999-9999')).toBe('+5511999999999');
    expect(normalizePhone('+55 (85) 98714-9385')).toBe('+5585987149385');
    expect(normalizePhone('85987149385')).toBe('+5585987149385');
    expect(normalizePhone('+85987149385')).toBe('+5585987149385');
    expect(normalizePhone('5511999999999')).toBe('+5511999999999');
  });

  it('keeps explicit international numbers', () => {
    expect(normalizePhone('+1 510 555 1234')).toBe('+15105551234');
  });

  it('treats 11-digit NANP numbers as +1 instead of Brazil', () => {
    expect(normalizePhone('15106179624')).toBe('+15106179624');
    expect(toWhatsappRecipient('15106179624')).toBe('15106179624');
  });

  it('validates E.164 after normalization', () => {
    expect(isValidPhone('11999999999')).toBe(true);
    expect(isValidPhone('15106179624')).toBe(true);
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });

  it('strips the plus for the WhatsApp recipient field', () => {
    expect(toWhatsappRecipient('+55 11 99999-9999')).toBe('5511999999999');
    expect(toWhatsappRecipient('+1 510 617 9624')).toBe('15106179624');
    expect(toWhatsappRecipient('85987149385')).toBe('5585987149385');
    expect(toWhatsappRecipient('+85987149385')).toBe('5585987149385');
    expect(toWhatsappRecipient('+55 (85) 98714-9385')).toBe('5585987149385');
  });
});
