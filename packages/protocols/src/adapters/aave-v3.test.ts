import { afterEach, describe, expect, it, vi } from "vitest";

import { aaveV3Adapter } from "./aave-v3";

function createGraphQLResponse(data: unknown) {
  return {
    ok: true,
    json: async () => ({ data }),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("aaveV3Adapter", () => {
  it("maps Base positions and yields from Aave GraphQL", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        query?: string;
        variables?: { user?: string | null };
      };

      if (body.query?.includes("AaveMarkets") && body.variables?.user) {
        return createGraphQLResponse({
          markets: [
            {
              address: "0xmarket",
              name: "Base Market",
              userState: { healthFactor: "1.85" },
              reserves: [],
            },
          ],
        });
      }

      if (body.query?.includes("AaveUserSupplies")) {
        return createGraphQLResponse({
          userSupplies: [
            {
              market: { address: "0xmarket", name: "Base Market" },
              currency: {
                address: "0xusdc",
                symbol: "USDC",
                decimals: 6,
                name: "USD Coin",
              },
              balance: {
                amount: { value: "125.5", decimals: 6, raw: "125500000" },
                usd: "125.5",
              },
              apy: { value: "4.2", formatted: "4.2" },
              isCollateral: true,
              canBeCollateral: true,
            },
          ],
        });
      }

      if (body.query?.includes("AaveUserBorrows")) {
        return createGraphQLResponse({
          userBorrows: [
            {
              market: { address: "0xmarket", name: "Base Market" },
              currency: {
                address: "0xweth",
                symbol: "WETH",
                decimals: 18,
                name: "Wrapped Ether",
              },
              debt: {
                amount: { value: "0.75", decimals: 18, raw: "750000000000000000" },
                usd: "2400",
              },
              apy: { value: "5.1", formatted: "5.1" },
            },
          ],
        });
      }

      if (body.query?.includes("AaveMarkets") && body.variables?.user === null) {
        return createGraphQLResponse({
          markets: [
            {
              address: "0xmarket",
              name: "Base Market",
              reserves: [
                {
                  underlyingToken: {
                    address: "0xusdc",
                    symbol: "USDC",
                    decimals: 6,
                    name: "USD Coin",
                  },
                  supplyInfo: { apy: { value: "4.2", formatted: "4.2" } },
                  borrowInfo: { apy: { value: "6.9", formatted: "6.9" } },
                },
              ],
            },
          ],
        });
      }

      throw new Error(`Unexpected query: ${body.query ?? "missing"}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const positions = await aaveV3Adapter.getPositions({
      address: "0x0000000000000000000000000000000000000001",
      chainId: 8453,
    });

    expect(positions).toHaveLength(2);
    expect(positions[0]?.kind).toBe("lend_supply");
    expect(positions[0]?.supplied?.symbol).toBe("USDC");
    expect(positions[0]?.usdValue).toBe(125.5);
    expect(positions[1]?.kind).toBe("lend_borrow");
    expect(positions[1]?.borrowed?.symbol).toBe("WETH");
    expect(positions[1]?.usdValue).toBe(2400);

    const yields = await aaveV3Adapter.getYields({ chainId: 8453 });

    expect(yields).toEqual([
      expect.objectContaining({
        assetSymbol: "USDC",
        protocolName: "Aave v3",
        supplyApy: 4.2,
        borrowApy: 6.9,
      }),
    ]);
  });
});
