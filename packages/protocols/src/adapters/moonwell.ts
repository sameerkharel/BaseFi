import type {
  PositionRequest,
  ProtocolAdapter,
  YieldRequest,
} from "../adapter";

export const moonwellAdapter: ProtocolAdapter = {
  metadata: {
    id: "moonwell-base",
    name: "Moonwell",
    chainId: 8453,
    supportedChainIds: [8453],
    category: "lending",
    website: "https://moonwell.fi",
    docsUrl: "https://docs.moonwell.fi/",
  },
  async getPositions(_request: PositionRequest) {
    return [];
  },
  async getYields(_request: YieldRequest) {
    return [];
  },
};
