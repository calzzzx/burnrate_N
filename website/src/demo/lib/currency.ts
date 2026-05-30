// Demo currency layer: no network, no DB cache — just deterministic fallback
// rates so multi-currency conversion in the demo always works offline.

// Hardcoded fallback rates (to USD)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CNY: 7.24,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.53,
  KRW: 1350,
  HKD: 7.82,
  TWD: 32.2,
}

export type ExchangeRates = Record<string, number>

export async function fetchExchangeRates(baseCurrency: string): Promise<ExchangeRates> {
  return computeFallbackRates(baseCurrency)
}

function computeFallbackRates(baseCurrency: string): ExchangeRates {
  const baseToUsd = FALLBACK_RATES[baseCurrency] ?? 1
  const rates: ExchangeRates = {}
  for (const [currency, usdRate] of Object.entries(FALLBACK_RATES)) {
    // rate = how many units of `currency` per 1 unit of `baseCurrency`
    rates[currency] = usdRate / baseToUsd
  }
  return rates
}

/** Convert an amount from one currency to another using the provided rates (keyed by target base). */
export function convertAmount(amount: number, fromCurrency: string, rates: ExchangeRates): number {
  if (!rates[fromCurrency]) return amount
  // rates are "1 base = X foreign", so to convert foreign → base: amount / rate
  return amount / rates[fromCurrency]
}
