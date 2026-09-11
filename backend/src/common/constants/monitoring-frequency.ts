export const ALLOWED_FREQUENCY_MINUTES = [5, 10, 15, 30, 60, 120, 360, 720, 1440] as const;

export type AllowedFrequencyMinutes = (typeof ALLOWED_FREQUENCY_MINUTES)[number];
