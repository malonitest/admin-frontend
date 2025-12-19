export const PRAGUE_TIME_ZONE = 'Europe/Prague' as const;

const hasExplicitTimeZone = (value: string): boolean => /([zZ]|[+-]\d{2}:\d{2})$/.test(value);

/**
 * Parse API date strings consistently.
 *
 * If the backend returns an ISO string without timezone (historical bug), we treat it as UTC
 * by appending `Z` so the same timestamp is interpreted consistently across browsers.
 */
export const parseApiDate = (value: string | Date): Date => {
  if (value instanceof Date) return value;
  return new Date(hasExplicitTimeZone(value) ? value : `${value}Z`);
};

export const tryParseApiDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  const d = parseApiDate(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDateTimePrague = (
  value?: string | Date | null,
  opts?: { includeSeconds?: boolean }
): string => {
  if (!value) return '-';
  const date = parseApiDate(value);
  if (Number.isNaN(date.getTime())) return '-';

  const includeSeconds = opts?.includeSeconds ?? false;

  const datePart = date.toLocaleDateString('cs-CZ', { timeZone: PRAGUE_TIME_ZONE });
  const timePart = date.toLocaleTimeString('cs-CZ', {
    timeZone: PRAGUE_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' as const } : null),
  });

  return `${datePart} ${timePart}`;
};

export const tryFormatDateTimePrague = (
  value?: string | Date | null,
  opts?: { includeSeconds?: boolean }
): string => {
  if (!value) return '';
  const out = formatDateTimePrague(value, opts);
  return out === '-' ? '' : out;
};

export const formatDatePrague = (value?: string | Date | null): string => {
  if (!value) return '-';
  const date = parseApiDate(value);
  return date.toLocaleDateString('cs-CZ', { timeZone: PRAGUE_TIME_ZONE });
};

export const formatTimePrague = (
  value?: string | Date | null,
  opts?: { includeSeconds?: boolean }
): string => {
  if (!value) return '-';
  const date = parseApiDate(value);
  const includeSeconds = opts?.includeSeconds ?? false;
  return date.toLocaleTimeString('cs-CZ', {
    timeZone: PRAGUE_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' as const } : null),
  });
};
