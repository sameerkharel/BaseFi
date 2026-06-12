"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { normalizeAddress } from "../lib/address";
import { formatPercent, formatUsd } from "../../../packages/shared/src";

const protocolCards = [
  {
    name: "Aave v3",
    status: "Lending",
    summary: "Supply and borrow balances",
  },
  {
    name: "Moonwell",
    status: "Lending",
    summary: "Base-native market exposure",
  },
  {
    name: "Aerodrome",
    status: "LP + staking",
    summary: "Liquidity and gauge rewards",
  },
];

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
    <main className="dashboard-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Base portfolio dashboard</p>
          <h1>Track lending, LP, staking, and rewards in one read-only view.</h1>
          <p className="hero-copy">
            Connect a wallet or paste an address to inspect your Base DeFi footprint and compare yields across the
            main protocols.
          </p>
        </div>

        <div className="entry-card">
          <div className="entry-actions">
            {isConnected ? (
              <>
                <div>
                  <span className="entry-label">Connected wallet</span>
                  <strong>{address}</strong>
                </div>
                <button type="button" className="secondary-button" onClick={() => disconnect()}>
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={() => connect({ connector: connectors[0] })}
                disabled={isPending || connectors.length === 0}
              >
                Connect wallet
              </button>
            )}
          </div>

          <div className="watch-form">
            <label htmlFor="watch-address">Watch mode address</label>
            <div className="watch-input-row">
              <input
                id="watch-address"
                value={watchInput}
                onChange={(event) => setWatchInput(event.target.value)}
                placeholder="0x..."
              />
              <button type="button" className="secondary-button" onClick={applyWatchAddress}>
                View
              </button>
            </div>
          </div>

          <p className="active-address">
            {activeAddress ? activeAddress : "Connect a wallet or paste an address to begin."}
          </p>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <span>Total portfolio value</span>
          <strong>{formatUsd(0)}</strong>
          <p>Aggregated across supported Base protocols.</p>
        </article>
        <article className="summary-card">
          <span>Unclaimed rewards</span>
          <strong>{formatUsd(0)}</strong>
          <p>Claimable incentives and emissions.</p>
        </article>
        <article className="summary-card">
          <span>Average net APY</span>
          <strong>{formatPercent(null)}</strong>
          <p>Base yield plus rewards, separated by source.</p>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>Protocol breakdown</h2>
            <span>Positions and exposure</span>
          </div>
          <div className="protocol-list">
            {protocolCards.map((protocol) => (
              <div className="protocol-card" key={protocol.name}>
                <div>
                  <strong>{protocol.name}</strong>
                  <span>{protocol.status}</span>
                </div>
                <p>{protocol.summary}</p>
                <div className="protocol-metrics">
                  <span>{formatUsd(0)} supplied</span>
                  <span>{formatUsd(0)} borrowed</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Yield comparison</h2>
            <span>Idle capital opportunities</span>
          </div>
          <div className="comparison-table">
            <div>
              <strong>USDC</strong>
              <span>Aave: --</span>
              <span>Moonwell: --</span>
              <span>Morpho: --</span>
            </div>
            <div>
              <strong>ETH</strong>
              <span>Aave: --</span>
              <span>Moonwell: --</span>
              <span>Aerodrome: --</span>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
