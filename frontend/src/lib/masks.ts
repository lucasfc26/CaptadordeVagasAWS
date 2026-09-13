function isBrazilianMobile11(digits: string): boolean {
  if (digits.length !== 11) return false;
  const ddd = Number(digits.slice(0, 2));
  return ddd >= 11 && ddd <= 99 && digits[2] === '9';
}

export function formatPhoneMask(input: string): string {
  let digits = input.replace(/\D/g, '');
  const looksUs =
    input.trim().startsWith('+1') ||
    (digits.startsWith('1') && digits.length >= 11 && !isBrazilianMobile11(digits.slice(0, 11)));

  if (looksUs) {
    if (digits.startsWith('1')) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    if (!digits) return '+1 ';
    if (digits.length <= 3) return `+1 (${digits}`;
    if (digits.length <= 6) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.startsWith('55') && digits.length > 11) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);

  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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
