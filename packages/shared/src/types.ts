export type PositionKind =
  | "lend_supply"
  | "lend_borrow"
  | "liquidity_pool"
  | "stake"
  | "reward"
  | "idle";

export interface TokenAmount {
  address: string;
  symbol: string;
  decimals: number;
  amount: string;
  usdValue?: number;
}

export interface PositionBreakdown {
  token: TokenAmount;
  share?: number;
}

export interface PortfolioPosition {
  id: string;
  protocolId: string;
  protocolName: string;
  chainId: number;
  kind: PositionKind;
  label: string;
  supplied?: TokenAmount;
  borrowed?: TokenAmount;
  deposited?: TokenAmount;
  rewards?: TokenAmount[];
  underlying?: PositionBreakdown[];
  usdValue?: number;
  apr?: number;
  apy?: number;
  healthFactor?: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface YieldQuote {
  assetSymbol: string;
  assetAddress?: string;
  protocolId: string;
  protocolName: string;
  chainId: number;
  supplyApy?: number;
  borrowApy?: number;
  rewardApy?: number;
  tvlUsd?: number;
  source: string;
  updatedAt: string;
}

export interface PortfolioSnapshot {
  walletAddress: string;
  chainId: number;
  positions: PortfolioPosition[];
  yields: YieldQuote[];
  totalUsdValue: number;
  totalRewardsUsd: number;
  warnings: string[];
  updatedAt: string;
}
