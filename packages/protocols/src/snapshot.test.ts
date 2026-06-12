import { describe, expect, it } from "vitest";

import type { ProtocolAdapter } from "./adapter";
import { buildPortfolioSnapshot } from "./snapshot";

function createAdapter(options: {
  id: string;
  supportedChainIds: number[];
  positions?: Awaited<ReturnType<ProtocolAdapter["getPositions"]>>;
  yields?: Awaited<ReturnType<ProtocolAdapter["getYields"]>>;
  failYields?: boolean;
}): ProtocolAdapter {
  return {
    metadata: {
      id: options.id,
      name: options.id,
      chainId: options.supportedChainIds[0],
      supportedChainIds: options.supportedChainIds,
      category: "lending",
    },
    async getPositions() {
      return options.positions ?? [];
    },
    async getYields() {
      if (options.failYields) {
        throw new Error(`${options.id} unavailable`);
      }

      return options.yields ?? [];
    },
  };
}

describe("buildPortfolioSnapshot", () => {
  it("aggregates positions and yields from supported adapters", async () => {
    const snapshot = await buildPortfolioSnapshot({
      address: "0x0000000000000000000000000000000000000001",
      chainId: 8453,
      adapters: [
        createAdapter({
          id: "aave",
          supportedChainIds: [8453],
          positions: [
            {
              id: "aave-supply",
              protocolId: "aave",
              protocolName: "Aave v3",
              chainId: 8453,
              kind: "lend_supply",
              label: "USDC Supply",
              supplied: {
                address: "0x0000000000000000000000000000000000000002",
                symbol: "USDC",
                decimals: 6,
                amount: "100",
                usdValue: 100,
              },
              usdValue: 100,
            },
          ],
          yields: [
            {
              assetSymbol: "USDC",
              protocolId: "aave",
              protocolName: "Aave v3",
              chainId: 8453,
              supplyApy: 4.2,
              source: "defillama",
              updatedAt: "2026-06-12T00:00:00.000Z",
            },
          ],
        }),
      ],
    });

    expect(snapshot.totalUsdValue).toBe(100);
    expect(snapshot.totalRewardsUsd).toBe(0);
    expect(snapshot.positions).toHaveLength(1);
    expect(snapshot.yields).toHaveLength(1);
    expect(snapshot.warnings).toEqual([]);
  });

  it("keeps healthy data when one adapter fails", async () => {
    const snapshot = await buildPortfolioSnapshot({
      address: "0x0000000000000000000000000000000000000001",
      chainId: 8453,
      adapters: [
        createAdapter({
          id: "aave",
          supportedChainIds: [8453],
          positions: [],
          yields: [],
        }),
        createAdapter({
          id: "moonwell",
          supportedChainIds: [8453],
          failYields: true,
        }),
      ],
    });

    expect(snapshot.positions).toHaveLength(0);
    expect(snapshot.yields).toHaveLength(0);
    expect(snapshot.warnings).toContain("moonwell unavailable");
  });
});
