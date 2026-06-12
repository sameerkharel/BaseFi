import type {
  PositionRequest,
  ProtocolAdapter,
  YieldRequest,
} from "../adapter";

const AAVE_GRAPHQL_ENDPOINT = "https://api.v3.aave.com/graphql";

type DecimalValue = {
  value: string;
  decimals: number;
  raw: string;
};

type TokenAmount = {
  amount: DecimalValue;
  usd: string;
};

type PercentValue = {
  value: string;
  formatted: string;
};

type AaveMarketState = {
  healthFactor?: string | null;
};

type AaveMarket = {
  address: string;
  name: string;
  userState?: AaveMarketState | null;
  reserves?: AaveReserve[];
};

type AaveReserve = {
  underlyingToken: {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
  };
  supplyInfo: {
    apy: PercentValue;
  };
  borrowInfo?: {
    apy: PercentValue;
  } | null;
};

type AaveSupplyPosition = {
  market: {
    address: string;
    name: string;
  };
  currency: {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
  };
  balance: TokenAmount;
  apy: PercentValue;
  isCollateral: boolean;
  canBeCollateral: boolean;
};

type AaveBorrowPosition = {
  market: {
    address: string;
    name: string;
  };
  currency: {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
  };
  debt: TokenAmount;
  apy: PercentValue;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

async function fetchAaveGraphQL<T>(query: string, variables: Record<string, unknown>) {
  const response = await fetch(AAVE_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Aave API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "Aave API returned an error");
  }

  if (!payload.data) {
    throw new Error("Aave API returned no data");
  }

  return payload.data;
}

async function loadAaveMarkets(chainId: number, address?: string) {
  const data = await fetchAaveGraphQL<{ markets: AaveMarket[] }>(
    `query AaveMarkets($chainIds: [ChainId!]!, $user: EvmAddress) {
      markets(request: { chainIds: $chainIds, user: $user }) {
        address
        name
        userState {
          healthFactor
        }
        reserves {
          underlyingToken {
            address
            symbol
            decimals
            name
          }
          supplyInfo {
            apy {
              value
              formatted
            }
          }
          borrowInfo {
            apy {
              value
              formatted
            }
          }
        }
      }
    }`,
    {
      chainIds: [chainId],
      user: address ?? null,
    },
  );

  return data.markets;
}

async function loadAaveSupplyPositions(address: string, marketAddresses: string[]) {
  if (!marketAddresses.length) {
    return [] as AaveSupplyPosition[];
  }

  const data = await fetchAaveGraphQL<{ userSupplies: AaveSupplyPosition[] }>(
    `query AaveUserSupplies($markets: [EvmAddress!]!, $user: EvmAddress!) {
      userSupplies(
        request: {
          markets: $markets
          user: $user
          collateralsOnly: false
          orderBy: { balance: DESC }
        }
      ) {
        market {
          address
          name
        }
        currency {
          address
          symbol
          decimals
          name
        }
        balance {
          amount {
            value
            decimals
            raw
          }
          usd
        }
        apy {
          value
          formatted
        }
        isCollateral
        canBeCollateral
      }
    }`,
    {
      markets: marketAddresses,
      user: address,
    },
  );

  return data.userSupplies;
}

async function loadAaveBorrowPositions(address: string, marketAddresses: string[]) {
  if (!marketAddresses.length) {
    return [] as AaveBorrowPosition[];
  }

  const data = await fetchAaveGraphQL<{ userBorrows: AaveBorrowPosition[] }>(
    `query AaveUserBorrows($markets: [EvmAddress!]!, $user: EvmAddress!) {
      userBorrows(
        request: {
          markets: $markets
          user: $user
          orderBy: { debt: DESC }
        }
      ) {
        market {
          address
          name
        }
        currency {
          address
          symbol
          decimals
          name
        }
        debt {
          amount {
            value
            decimals
            raw
          }
          usd
        }
        apy {
          value
          formatted
        }
      }
    }`,
    {
      markets: marketAddresses,
      user: address,
    },
  );

  return data.userBorrows;
}

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
  async getPositions(request: PositionRequest) {
    const markets = await loadAaveMarkets(request.chainId, request.address);
    const marketAddresses = markets.map((market) => market.address);
    const [supplyPositions, borrowPositions] = await Promise.all([
      loadAaveSupplyPositions(request.address, marketAddresses),
      loadAaveBorrowPositions(request.address, marketAddresses),
    ]);

    const healthFactor = markets[0]?.userState?.healthFactor ?? null;

    return [
      ...supplyPositions
        .filter((position) => toNumber(position.balance.usd) > 0)
        .map((position) => ({
          id: `aave-v3:${position.market.address}:${position.currency.address}:supply`,
          protocolId: "aave-v3-base",
          protocolName: "Aave v3",
          chainId: request.chainId,
          kind: "lend_supply" as const,
          label: `${position.currency.symbol} Supply`,
          supplied: {
            address: position.currency.address,
            symbol: position.currency.symbol,
            decimals: position.currency.decimals,
            amount: position.balance.amount.value,
            usdValue: toNumber(position.balance.usd),
          },
          usdValue: toNumber(position.balance.usd),
          apy: toNumber(position.apy.value),
          healthFactor: toNumber(healthFactor),
          metadata: {
            marketAddress: position.market.address,
            marketName: position.market.name,
            collateralEnabled: position.canBeCollateral,
            isCollateral: position.isCollateral,
          },
        })),
      ...borrowPositions
        .filter((position) => toNumber(position.debt.usd) > 0)
        .map((position) => ({
          id: `aave-v3:${position.market.address}:${position.currency.address}:borrow`,
          protocolId: "aave-v3-base",
          protocolName: "Aave v3",
          chainId: request.chainId,
          kind: "lend_borrow" as const,
          label: `${position.currency.symbol} Borrow`,
          borrowed: {
            address: position.currency.address,
            symbol: position.currency.symbol,
            decimals: position.currency.decimals,
            amount: position.debt.amount.value,
            usdValue: toNumber(position.debt.usd),
          },
          usdValue: toNumber(position.debt.usd),
          apy: toNumber(position.apy.value),
          healthFactor: toNumber(healthFactor),
          metadata: {
            marketAddress: position.market.address,
            marketName: position.market.name,
          },
        })),
    ];
  },
  async getYields(request: YieldRequest) {
    const markets = await loadAaveMarkets(request.chainId);

    return markets.flatMap((market) =>
      (market.reserves ?? []).map((reserve) => ({
        assetSymbol: reserve.underlyingToken.symbol,
        assetAddress: reserve.underlyingToken.address,
        protocolId: "aave-v3-base",
        protocolName: "Aave v3",
        chainId: request.chainId,
        supplyApy: toNumber(reserve.supplyInfo.apy.value),
        borrowApy: reserve.borrowInfo ? toNumber(reserve.borrowInfo.apy.value) : undefined,
        source: "Aave GraphQL",
        updatedAt: new Date().toISOString(),
      })),
    );
  },
};
