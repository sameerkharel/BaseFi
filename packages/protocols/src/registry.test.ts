import { describe, expect, it } from "vitest";

import type { ProtocolAdapter } from "./adapter";
import { createAdapterRegistry } from "./registry";

function createMockAdapter(protocolId: string, chainIds: number[]): ProtocolAdapter {
  return {
    metadata: {
      id: protocolId,
      name: protocolId,
      chainId: chainIds[0],
      supportedChainIds: chainIds,
      category: "lending",
    },
    async getPositions() {
      return [];
    },
    async getYields() {
      return [];
    },
  };
}

describe("createAdapterRegistry", () => {
  it("filters adapters by chain id", () => {
    const registry = createAdapterRegistry([
      createMockAdapter("aave", [8453]),
      createMockAdapter("moonwell", [8453, 10]),
    ]);

    expect(registry.list(8453).map((adapter) => adapter.id)).toEqual(["aave", "moonwell"]);
    expect(registry.list(10).map((adapter) => adapter.id)).toEqual(["moonwell"]);
  });

  it("returns undefined for unsupported chain requests", () => {
    const registry = createAdapterRegistry([createMockAdapter("aave", [8453])]);

    expect(registry.get("aave", 10)).toBeUndefined();
    expect(registry.get("aave", 8453)).toBeDefined();
  });
});
