import { getAddress, isAddress } from "viem";

export function normalizeAddress(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!isAddress(trimmed)) {
    return null;
  }

  return getAddress(trimmed);
}
