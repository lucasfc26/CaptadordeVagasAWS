const E164_PATTERN = /^\+[1-9]\d{9,14}$/;

function isBrazilianMobile11(digits: string): boolean {
  if (digits.length !== 11) {
    return false;
  }
  const ddd = Number(digits.slice(0, 2));
  return ddd >= 11 && ddd <= 99 && digits[2] === '9';
}

function isNanpWithCountryCode(digits: string): boolean {
  return digits.length === 11 && digits[0] === '1' && digits[1] >= '2' && digits[1] <= '9';
}

export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) {
    return trimmed;
  }
  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }
  if (digits.startsWith('55') && digits.length >= 12) {
    return `+${digits}`;
  }
  if (isNanpWithCountryCode(digits) && !isBrazilianMobile11(digits)) {
    return `+${digits}`;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  return trimmed;
}

export function isValidPhone(input: string): boolean {
  return E164_PATTERN.test(normalizePhone(input));
}

export function toWhatsappRecipient(phone: string): string {
  return normalizePhone(phone).replace(/\D/g, '');
}

export const PHONE_E164_REGEX = E164_PATTERN;
