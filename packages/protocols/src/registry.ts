import type { AdapterRegistry, ProtocolAdapter } from "./adapter";

export function createAdapterRegistry(adapters: ProtocolAdapter[]): AdapterRegistry {
  return {
    list(chainId?: number) {
      return adapters
        .filter((adapter) => {
          if (chainId === undefined) {
            return true;
          }

          return adapter.metadata.supportedChainIds.includes(chainId);
        })
        .map((adapter) => adapter.metadata);
    },
    get(protocolId: string, chainId?: number) {
      return adapters.find((adapter) => {
        if (adapter.metadata.id !== protocolId) {
          return false;
        }

        if (chainId === undefined) {
          return true;
        }

        return adapter.metadata.supportedChainIds.includes(chainId);
      });
    },
  };
}
