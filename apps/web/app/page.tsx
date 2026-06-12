"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { normalizeAddress } from "../lib/address";
import {
  formatPercent,
  formatRelativeMinutes,
  formatUsd,
  getYieldComparisonRows,
} from "../../../packages/shared/src";
import { usePortfolioSnapshot } from "../lib/portfolio";

const protocolCards = [
  {
    id: "aave-v3-base",
    name: "Aave v3",
    status: "Lending",
    summary: "Supply and borrow balances",
  },
  {
    id: "moonwell-base",
    name: "Moonwell",
    status: "Lending",
    summary: "Base-native market exposure",
  },
  {
    id: "aerodrome-base",
    name: "Aerodrome",
    status: "LP + staking",
    summary: "Liquidity and gauge rewards",
  },
];

const comparisonAssets = ["USDC", "ETH"];

function getProtocolUsdTotal(
  portfolioPositions:
    | {
        protocolName: string;
        supplied?: { usdValue?: number };
        borrowed?: { usdValue?: number };
      }[]
    | undefined,
  protocolName: string,
  key: "supplied" | "borrowed",
) {
  return portfolioPositions?.
    filter((position) => position.protocolName === protocolName)
    .reduce((runningTotal, position) => {
      return runningTotal + (position[key]?.usdValue ?? 0);
    }, 0) ?? 0;
}

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [watchInput, setWatchInput] = useState("");
  const [watchedAddress, setWatchedAddress] = useState<string | null>(null);

  const activeAddress = address ?? watchedAddress;
  const {
    data: portfolio,
    isFetching: isPortfolioFetching,
    isLoading: isPortfolioLoading,
  } = usePortfolioSnapshot(activeAddress ?? undefined);

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
          <strong>{formatUsd(portfolio?.totalUsdValue ?? 0)}</strong>
          <p>Aggregated across supported Base protocols.</p>
          <small>{portfolio ? formatRelativeMinutes(portfolio.updatedAt) : "waiting for snapshot"}</small>
        </article>
        <article className="summary-card">
          <span>Unclaimed rewards</span>
          <strong>{formatUsd(portfolio?.totalRewardsUsd ?? 0)}</strong>
          <p>Claimable incentives and emissions.</p>
        </article>
        <article className="summary-card">
          <span>Average net APY</span>
          <strong>{formatPercent(portfolio?.yields[0]?.supplyApy ?? null)}</strong>
          <p>Base yield plus rewards, separated by source.</p>
        </article>
      </section>

      {isPortfolioFetching ? <section className="loading-strip">Refreshing portfolio snapshot...</section> : null}

      {portfolio?.warnings.length ? (
        <section className="warning-panel">
          <strong>Partial data loaded</strong>
          <p>{portfolio.warnings.join(" ")}</p>
        </section>
      ) : null}

      <section className="content-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>Protocol breakdown</h2>
            <span>{isPortfolioLoading ? "Loading positions" : "Positions and exposure"}</span>
          </div>
          {!activeAddress ? (
            <div className="empty-panel">Connect a wallet or paste an address to load protocol data.</div>
          ) : null}
          <div className="protocol-list">
            {protocolCards.map((protocol) => (
              <div className="protocol-card" key={protocol.id}>
                <div>
                  <strong>{protocol.name}</strong>
                  <span>{protocol.status}</span>
                </div>
                <p>{protocol.summary}</p>
                <div className="protocol-meta">
                  <span>
                    {portfolio?.positions.filter((position) => position.protocolId === protocol.id).length ?? 0} active
                    positions
                  </span>
                  <span>
                    {formatPercent(
                      portfolio?.yields.find((yieldQuote) => yieldQuote.protocolId === protocol.id)?.supplyApy ?? null,
                    )} supply APY
                  </span>
                </div>
                <div className="protocol-metrics">
                  <span>{formatUsd(getProtocolUsdTotal(portfolio?.positions, protocol.name, "supplied"))} supplied</span>
                  <span>{formatUsd(getProtocolUsdTotal(portfolio?.positions, protocol.name, "borrowed"))} borrowed</span>
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
            {comparisonAssets.map((assetSymbol) => {
              const rows = getYieldComparisonRows(portfolio?.yields ?? [], assetSymbol);

              return (
                <div key={assetSymbol}>
                  <strong>{assetSymbol}</strong>
                  {rows.length > 0 ? (
                    rows.map((row) => (
                      <span key={row.protocolName}>
                        {row.protocolName}: {formatPercent(row.totalApy)}
                      </span>
                    ))
                  ) : (
                    <span>No APY data available yet.</span>
                  )}
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </main>
  );
}
