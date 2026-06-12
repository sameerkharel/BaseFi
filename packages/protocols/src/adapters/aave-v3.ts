import type {
  PositionRequest,
  ProtocolAdapter,
  YieldRequest,
} from "../adapter";

export const aaveV3Adapter: ProtocolAdapter = {
  metadata: {
    id: "aave-v3-base",
    name: "Aave v3",
    chainId: 8453,
    supportedChainIds: [8453],
    category: "lending",
    website: "https://aave.com",
    docsUrl: "https://docs.aave.com/",
  },
  async getPositions(_request: PositionRequest) {
    return [];
  },
  async getYields(_request: YieldRequest) {
    return [];
  },
};
