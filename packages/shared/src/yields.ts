import type { YieldQuote } from "./types";

export interface YieldComparisonRow {
  protocolName: string;
  supplyApy?: number;
  borrowApy?: number;
  rewardApy?: number;
  totalApy?: number;
}

export function getYieldComparisonRows(
  yields: YieldQuote[],
  assetSymbol: string,
): YieldComparisonRow[] {
  return yields
    .filter((quote) => quote.assetSymbol === assetSymbol)
    .map((quote) => ({
      protocolName: quote.protocolName,
      supplyApy: quote.supplyApy,
      borrowApy: quote.borrowApy,
      rewardApy: quote.rewardApy,
      totalApy: (quote.supplyApy ?? 0) + (quote.rewardApy ?? 0),
    }))
    .sort((left, right) => (right.totalApy ?? 0) - (left.totalApy ?? 0));
}
