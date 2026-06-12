"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { normalizeAddress } from "../lib/address";

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [watchInput, setWatchInput] = useState("");
  const [watchedAddress, setWatchedAddress] = useState<string | null>(null);

  const activeAddress = address ?? watchedAddress;

  function applyWatchAddress() {
    const normalized = normalizeAddress(watchInput);

    if (normalized) {
      setWatchedAddress(normalized);
    }
  }

  return (
    <main>
      <section>
        <h1>BaseFi</h1>
        <p>Read-only dashboard for Base DeFi positions, yields, and rewards.</p>

        <div>
          {isConnected ? (
            <>
              <p>Connected wallet: {address}</p>
              <button type="button" onClick={() => disconnect()}>
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => connect({ connector: connectors[0] })}
              disabled={isPending || connectors.length === 0}
            >
              Connect wallet
            </button>
          )}
        </div>

        <div>
          <label htmlFor="watch-address">Watch mode address</label>
          <input
            id="watch-address"
            value={watchInput}
            onChange={(event) => setWatchInput(event.target.value)}
            placeholder="0x..."
          />
          <button type="button" onClick={applyWatchAddress}>
            View address
          </button>
        </div>

        {activeAddress ? (
          <p>Active portfolio: {activeAddress}</p>
        ) : (
          <p>Connect a wallet or paste an address to begin.</p>
        )}
      </section>
    </main>
  );
}
