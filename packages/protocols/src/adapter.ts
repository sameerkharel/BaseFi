import type {
  PortfolioPosition,
  PortfolioSnapshot,
  YieldQuote,
} from "../../shared/src/types";

export interface ProtocolMetadata {
  id: string;
  name: string;
  chainId: number;
  category: "lending" | "amm" | "staking" | "vault";
  website?: string;
  subgraphUrl?: string;
  docsUrl?: string;
}

export interface PositionRequest {
  address: string;
  chainId: number;
}

export interface YieldRequest {
  chainId: number;
}

export interface ProtocolAdapter {
  readonly metadata: ProtocolMetadata;
  getPositions(request: PositionRequest): Promise<PortfolioPosition[]>;
  getYields(request: YieldRequest): Promise<YieldQuote[]>;
}

export interface AdapterRegistry {
  list(): ProtocolMetadata[];
  get(protocolId: string): ProtocolAdapter | undefined;
}

export type SnapshotBuilder = (input: {
  address: string;
  chainId: number;
  adapters: ProtocolAdapter[];
}) => Promise<PortfolioSnapshot>;
