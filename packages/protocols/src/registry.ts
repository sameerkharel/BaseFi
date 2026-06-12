import type { AdapterRegistry, ProtocolAdapter } from "./adapter";

export function createAdapterRegistry(adapters: ProtocolAdapter[]): AdapterRegistry {
  return {
    list() {
      return adapters.map((adapter) => adapter.metadata);
    },
    get(protocolId: string) {
      return adapters.find((adapter) => adapter.metadata.id === protocolId);
    },
  };
}
