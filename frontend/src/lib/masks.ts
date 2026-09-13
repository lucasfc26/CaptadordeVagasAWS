function isBrazilianMobile11(digits: string): boolean {
  if (digits.length !== 11) return false;
  const ddd = Number(digits.slice(0, 2));
  return ddd >= 11 && ddd <= 99 && digits[2] === '9';
}

function formatBrazilLocal(digits: string): string {
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatUsLocal(digits: string): string {
  if (!digits) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Phone mask with explicit country calling code (required by WhatsApp Cloud API).
 * - Brazil (default): +55 (85) 98714-9385
 * - USA/Canada:      +1 (510) 555-1234
 */
export function formatPhoneMask(input: string): string {
  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, '');

  const looksUs =
    trimmed.startsWith('+1') ||
    (digits.startsWith('1') && digits.length >= 11 && !isBrazilianMobile11(digits.slice(0, 11)));

  if (looksUs) {
    if (digits.startsWith('1')) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    if (!digits) return '+1 ';
    return `+1 ${formatUsLocal(digits)}`;
  }

  // Brazil (default): keep +55 visible so WhatsApp recipients include country code
  if (digits.startsWith('55') && digits.length > 11) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);

  if (!digits) {
    // Keep "+55" visible while the user clears/edits the national number
    if (trimmed.startsWith('+') || trimmed.startsWith('55')) return '+55 ';
    return '';
  }

  return `+55 ${formatBrazilLocal(digits)}`;
}

export function formatEmailMask(input: string): string {
  const raw = input.toLowerCase().replace(/\s/g, '');
  const at = raw.indexOf('@');
  if (at === -1) {
    return raw.replace(/[^a-z0-9._%+\-]/g, '');
  }

  const local = raw.slice(0, at).replace(/[^a-z0-9._%+\-]/g, '');
  const domain = raw.slice(at + 1).replace(/@/g, '').replace(/[^a-z0-9.-]/g, '');
  return `${local}@${domain}`;
}

export type InputMask = 'phone' | 'email';

export function applyInputMask(mask: InputMask, value: string): string {
  return mask === 'phone' ? formatPhoneMask(value) : formatEmailMask(value);
}
