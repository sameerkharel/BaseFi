import { useQuery } from "@tanstack/react-query";

import {
  aaveV3Adapter,
  aerodromeAdapter,
  buildPortfolioSnapshot,
  moonwellAdapter,
} from "../../../packages/protocols/src";

const protocolAdapters = [aaveV3Adapter, moonwellAdapter, aerodromeAdapter];
const baseChainId = 8453;

export function usePortfolioSnapshot(address: string | undefined) {
  return useQuery({
    queryKey: ["portfolio-snapshot", address],
    queryFn: () => {
      if (!address) {
        throw new Error("Address is required");
      }

      return buildPortfolioSnapshot({
        address,
        chainId: baseChainId,
        adapters: protocolAdapters,
      });
    },
    enabled: Boolean(address),
    staleTime: 30_000,
  });
}
