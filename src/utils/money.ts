export const formatMoney = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);

/**
 * Currency with fixed two-decimal places, e.g. A$146,026.00 / A$7,035.00.
 * Uses en-AU narrow symbols so AUD renders as "A$" rather than "$". Preferred on
 * cards/summaries where amounts must read consistently and never wrap.
 */
export const formatMoneyPrecise = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const parseDateOnly = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date(value);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const formatDate = (date: string) => {
  const parsed = parseDateOnly(date);
  if (Number.isNaN(parsed.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
};

export const toNumber = (value: string) => {
  const normalized = value.trim().replace(/[$,\s]/g, '');
  if (!/^-?(?:\d+|\d*\.\d{1,2})$/.test(normalized)) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
