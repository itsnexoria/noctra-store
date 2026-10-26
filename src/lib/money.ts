/** All money is integer minor units (cents) + an explicit ISO currency. Never floats. */
export type Currency = "ZAR" | "USD" | "GBP" | "EUR";

export interface Money {
  amountMinor: number;
  currency: Currency;
}

export const money = (amountMinor: number, currency: Currency): Money => {
  if (!Number.isInteger(amountMinor)) throw new Error("amountMinor must be an integer");
  return { amountMinor, currency };
};

function assertSame(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
}

export const add = (a: Money, b: Money): Money => (assertSame(a, b), money(a.amountMinor + b.amountMinor, a.currency));
export const sub = (a: Money, b: Money): Money => (assertSame(a, b), money(a.amountMinor - b.amountMinor, a.currency));

/** Multiply by basis points (1 bp = 0.01%), rounding half away from zero. */
export const mulBps = (a: Money, bps: number): Money => {
  const raw = (a.amountMinor * bps) / 10_000;
  return money(Math.sign(raw) * Math.round(Math.abs(raw)), a.currency);
};

/** Convert using an explicit rate (target units per 1 source unit). Rate must come from a stated source. */
export const convert = (a: Money, rate: number, to: Currency): Money => {
  if (!(rate > 0)) throw new Error("rate must be > 0");
  return money(Math.round(a.amountMinor * rate), to);
};

export const format = (a: Money, locale = "en-ZA"): string =>
  new Intl.NumberFormat(locale, { style: "currency", currency: a.currency }).format(a.amountMinor / 100);
