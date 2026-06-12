import type { PortfolioSnapshot } from "../../shared/src/types";

import type { ProtocolAdapter } from "./adapter";

interface SnapshotInput {
  address: string;
  chainId: number;
  adapters: ProtocolAdapter[];
}

function sumPositionRewardsUsd(snapshotPositions: PortfolioSnapshot["positions"]) {
  return snapshotPositions.reduce((runningTotal, position) => {
    const rewardTotal = position.rewards?.reduce((rewardRunningTotal, reward) => {
      return rewardRunningTotal + (reward.usdValue ?? 0);
    }, 0);

    return runningTotal + (rewardTotal ?? 0);
  }, 0);
}

export async function buildPortfolioSnapshot({
  address,
  chainId,
  adapters,
}: SnapshotInput): Promise<PortfolioSnapshot> {
  const supportedAdapters = adapters.filter((adapter) =>
    adapter.metadata.supportedChainIds.includes(chainId),
  );

  const settledResults = await Promise.allSettled(
    supportedAdapters.map(async (adapter) => {
      const [positions, yields] = await Promise.all([
        adapter.getPositions({ address, chainId }),
        adapter.getYields({ chainId }),
      ]);

      return {
        adapter,
        positions,
        yields,
      };
    }),
  );

  const warnings = settledResults.flatMap((result) => {
    if (result.status === "fulfilled") {
      return [];
    }

    return [result.reason instanceof Error ? result.reason.message : "Failed to load a protocol adapter"];
  });

  const fulfilledResults = settledResults.flatMap((result) => {
    if (result.status !== "fulfilled") {
      return [];
    }

    return [result.value];
  });

  const positions = fulfilledResults.flatMap((result) => result.positions);
  const yields = fulfilledResults.flatMap((result) => result.yields);
  const totalUsdValue = positions.reduce((runningTotal, position) => {
    return runningTotal + (position.usdValue ?? 0);
  }, 0);
  const totalRewardsUsd = sumPositionRewardsUsd(positions);

  return {
    walletAddress: address,
    chainId,
    positions,
    yields,
    totalUsdValue,
    totalRewardsUsd,
    warnings,
    updatedAt: new Date().toISOString(),
  };
}
