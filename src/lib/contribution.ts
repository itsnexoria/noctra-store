import { Money, add, mulBps, money, sub } from "./money";

/** Payment fee model. Rates are CONFIG, copied from the gateway's published pricing at a stated date. */
export interface FeeModel {
  percentBps: number; // e.g. 310 = 3.10%
  fixedMinor: number; // e.g. 100 = R1.00
  vatOnFeeBps: number; // e.g. 1500 = 15% VAT charged on the fee (0 if recoverable/not applicable)
}

export interface ContributionInput {
  /** Customer-paid price excluding any sales tax/VAT collected on behalf of a tax authority. */
  revenueExTax: Money;
  /** Supplier production cost, already converted into the selling currency (state the FX rate + buffer elsewhere). */
  production: Money;
  /** Shipping the supplier charges that the customer did NOT pay for. */
  shippingSubsidy: Money;
  discount: Money;
  /** Other known per-order variable costs. */
  otherVariable: Money;
  fee: FeeModel;
  /** Reserve for refunds/replacements, basis points of revenue (an estimate, not a measurement). */
  refundReserveBps: number;
}

export interface ContributionResult {
  paymentFee: Money;
  refundReserve: Money;
  contribution: Money;
  /** Contribution as basis points of net revenue. null when revenue <= 0. */
  marginBps: number | null;
  warnings: string[];
}

export function paymentFee(chargedAmount: Money, fee: FeeModel): Money {
  const base = add(mulBps(chargedAmount, fee.percentBps), money(fee.fixedMinor, chargedAmount.currency));
  return add(base, mulBps(base, fee.vatOnFeeBps));
}

export interface Thresholds {
  minMarginBps: number;
  minContributionMinor: number;
}

/** Defaults are a judgement call, not industry fact. Tune once real ad costs are known. */
export const DEFAULT_THRESHOLDS: Thresholds = { minMarginBps: 3500, minContributionMinor: 0 };

export function contribution(i: ContributionInput, t: Thresholds = DEFAULT_THRESHOLDS): ContributionResult {
  const net = sub(i.revenueExTax, i.discount);
  const fee = paymentFee(net, i.fee);
  const reserve = mulBps(net, i.refundReserveBps);
  const costs = [i.production, i.shippingSubsidy, i.otherVariable, fee, reserve].reduce((a, b) => add(a, b));
  const c = sub(net, costs);
  const marginBps = net.amountMinor > 0 ? Math.round((c.amountMinor * 10_000) / net.amountMinor) : null;

  const warnings: string[] = [];
  if (c.amountMinor <= 0) warnings.push("Loses money on every sale before advertising and overhead.");
  else if (marginBps !== null && marginBps < t.minMarginBps)
    warnings.push(`Contribution margin ${(marginBps / 100).toFixed(1)}% is below the ${(t.minMarginBps / 100).toFixed(0)}% floor; ad spend will likely erase it.`);
  if (c.amountMinor < t.minContributionMinor) warnings.push("Absolute contribution per order is below the configured minimum.");
  return { paymentFee: fee, refundReserve: reserve, contribution: c, marginBps, warnings };
}
