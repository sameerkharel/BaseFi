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
  const results = await Promise.all(
    adapters.map(async (adapter) => {
      const [positions, yields] = await Promise.all([
        adapter.getPositions({ address, chainId }),
        adapter.getYields({ chainId }),
      ]);

      return { positions, yields };
    }),
  );

  const positions = results.flatMap((result) => result.positions);
  const yields = results.flatMap((result) => result.yields);
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
    updatedAt: new Date().toISOString(),
  };
}
