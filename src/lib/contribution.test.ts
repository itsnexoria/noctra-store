import { describe, expect, it } from "vitest";
import { contribution, paymentFee, type FeeModel } from "./contribution";
import { add, convert, money, mulBps } from "./money";

// Paystack ZA international card pricing as published (3.1% + R1, VAT excl.), checked Oct 2026.
const paystackIntl: FeeModel = { percentBps: 310, fixedMinor: 100, vatOnFeeBps: 1500 };

describe("money", () => {
  it("rejects floats and currency mixing", () => {
    expect(() => money(1.5, "ZAR")).toThrow();
    expect(() => add(money(1, "ZAR"), money(1, "USD"))).toThrow();
  });
  it("rounds basis-point math half away from zero", () => {
    expect(mulBps(money(1010, "ZAR"), 50).amountMinor).toBe(5); // 5.05 -> 5
    expect(mulBps(money(-1010, "ZAR"), 50).amountMinor).toBe(-5);
  });
  it("converts with an explicit rate", () => {
    expect(convert(money(1000, "USD"), 18.5, "ZAR").amountMinor).toBe(18500);
  });
});

describe("paymentFee", () => {
  it("3.1% + R1 plus 15% VAT on the fee, on R1000", () => {
    // 3.1% of R1000 = R31; + R1 = R32; VAT 15% = R4.80; total R36.80
    expect(paymentFee(money(100000, "ZAR"), paystackIntl).amountMinor).toBe(3680);
  });
});

describe("contribution (illustrative numbers only)", () => {
  const base = {
    revenueExTax: money(100000, "ZAR"),
    production: money(40000, "ZAR"),
    shippingSubsidy: money(0, "ZAR"),
    discount: money(0, "ZAR"),
    otherVariable: money(0, "ZAR"),
    fee: paystackIntl,
    refundReserveBps: 300,
  };
  it("computes contribution", () => {
    const r = contribution(base);
    expect(r.paymentFee.amountMinor).toBe(3680);
    expect(r.refundReserve.amountMinor).toBe(3000);
    expect(r.contribution.amountMinor).toBe(100000 - 40000 - 3680 - 3000);
    expect(r.warnings).toEqual([]);
  });
  it("warns on thin margins and on losses", () => {
    expect(contribution({ ...base, production: money(70000, "ZAR") }).warnings.length).toBe(1);
    const loss = contribution({ ...base, production: money(100000, "ZAR") });
    expect(loss.contribution.amountMinor).toBeLessThan(0);
    expect(loss.warnings[0]).toMatch(/loses money/i);
  });
  it("applies discounts before fees", () => {
    const r = contribution({ ...base, discount: money(10000, "ZAR") });
    expect(r.paymentFee.amountMinor).toBe(paymentFee(money(90000, "ZAR"), paystackIntl).amountMinor);
  });
});
