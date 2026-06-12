import type {
  PositionRequest,
  ProtocolAdapter,
  YieldRequest,
} from "../adapter";

export const aerodromeAdapter: ProtocolAdapter = {
  metadata: {
    id: "aerodrome-base",
    name: "Aerodrome",
    chainId: 8453,
    category: "amm",
    website: "https://aerodrome.finance",
    docsUrl: "https://docs.aerodrome.finance/",
  },
  async getPositions(_request: PositionRequest) {
    return [];
  },
  async getYields(_request: YieldRequest) {
    return [];
  },
};
