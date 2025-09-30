import { useState } from "react";
import { useCookieJar } from "./hooks/useCookieJar";
import "./App.css";

const MAX_RENDERED_COOKIES = 60;

export default function App() {
  const [cookies, setCookies] = useState(3);
  const {
    isConnected,
    address,
    connect,
    connectors,
    isConnecting,
    connectError,
    disconnect,
    addCookies,
    totalQuery,
    revealTotal,
  } = useCookieJar();

  const handleConnect = async () => {
    const connector =
      connectors.find((item) => item.id === "metaMask" && item.ready) ??
      connectors.find((item) => item.ready) ??
      connectors[0];

    if (!connector) return;

    await connect({ connector });
  };

  const connectorsReady = connectors.some((connector) => connector.ready);
  const revealedTotal = totalQuery.data ?? revealTotal.data ?? null;
  const jarDisplay = revealedTotal
    ? "🍪"
        .repeat(Math.min(revealedTotal, MAX_RENDERED_COOKIES))
        .concat(revealedTotal > MAX_RENDERED_COOKIES ? " …" : "")
    : "🔒";
  const revealButtonBusy = revealTotal.isPending || totalQuery.isFetching;
  const revealButtonLabel =
    revealedTotal === null ? "Reveal total cookies" : "Refresh revealed total";

  const handleReveal = () => {
    if (revealedTotal === null) {
      revealTotal.mutate();
      return;
    }

    totalQuery.refetch();
  };

  const revealError = revealTotal.error ?? totalQuery.error ?? null;

  return (
    <div className="app-shell position-relative overflow-hidden">
      <div className="floating-pip" aria-hidden="true" />
      <div className="floating-pip" aria-hidden="true" />

      <div className="container position-relative">
        <header className="text-center mb-5">
          <div className="badge-frosted d-inline-flex align-items-center gap-2 mb-3 text-uppercase">
            <span className="glow-ring" aria-hidden="true">
              🪐
            </span>
            <span className="fw-semibold">Secret Cookie Jar Mission</span>
          </div>
          <h1 className="fw-bold display-5 cookie-constellation">
            Nebula Cookie Conservatory
          </h1>
          <p className="helper-text max-width-md mx-auto">
            Drop encrypted treats into the communal vault and watch the constellation grow. Only a coordinated reveal will decode the stash for the whole expedition.
          </p>
        </header>

        <section className="halo-card halo-card--accent p-4 p-lg-5">
          {!isConnected ? (
            <div className="text-center d-flex flex-column align-items-center gap-4">
              <p className="helper-text max-width-md">
                Dock a wallet to join the crew and contribute homomorphically scrambled cookie crumbs. We will keep the total cloaked until the reveal.
              </p>
              <button
                className="btn-nebula"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? "Linking wallet…" : "Launch wallet link"}
              </button>
              <div className="sparkle-separator max-width-md mx-auto">
                <span>Supported connectors</span>
              </div>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                {connectors.map((connector) => (
                  <span key={connector.uid} className="wallet-chip">
                    <span role="img" aria-hidden="true">
                      ✨
                    </span>
                    <span>{connector.name}</span>
                    {!connector.ready && <small>(unavailable)</small>}
                  </span>
                ))}
              </div>
              {!connectorsReady && (
                <p className="status-toast mb-0 max-width-md mx-auto">
                  MetaMask extension not detected. Install it or open the app in a MetaMask-enabled browser to start baking in orbit.
                </p>
              )}
              {connectError && (
                <p className="status-toast mb-0 max-width-md mx-auto">
                  {connectError.message}
                </p>
              )}
            </div>
          ) : (
            <div className="row g-4 g-lg-5">
              <div className="col-12 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <span className="badge-frosted">Crew Access Granted</span>
                <span className="wallet-chip">
                  <span role="img" aria-hidden="true">
                    🔐
                  </span>
                  <span>Wallet</span>
                  <code>{address?.slice(0, 6)}…{address?.slice(-4)}</code>
                </span>
              </div>

              <div className="col-lg-5">
                <div className="halo-card p-4 h-100 d-flex flex-column align-items-center text-center gap-3">
                  <p className="helper-text mb-0">Cosmic jar telemetry</p>
                  <div className="cookie-orbit">
                    <span aria-live="polite">{jarDisplay}</span>
                  </div>
                  {revealedTotal !== null ? (
                    <p className="fw-semibold text-warning mb-0">
                      🍪 Total cookies decoded: {revealedTotal}
                    </p>
                  ) : (
                    <p className="helper-text mb-0">
                      Quantum crumbs remain encrypted. Trigger a reveal when the squad is ready.
                    </p>
                  )}
                </div>
              </div>

              <div className="col-lg-7">
                <div className="d-grid gap-4 h-100">
                  <div className="halo-card p-4">
                    <p className="helper-text mb-3">
                      Set your payload of cookies to beam into the jar (1 - 5).
                    </p>
                    <div className="d-flex flex-column flex-md-row gap-3 align-items-start align-items-md-center">
                      <label className="fw-semibold text-uppercase small" htmlFor="cookie-input">
                        Cookie payload
                      </label>
                      <input
                        id="cookie-input"
                        value={cookies}
                        min={1}
                        max={5}
                        type="number"
                        onChange={(event) => setCookies(Number(event.target.value))}
                        className="form-control form-control-lg"
                      />
                    </div>
                    <button
                      className="btn-nebula mt-4 w-100 w-md-auto"
                      onClick={() => addCookies.mutate(cookies)}
                      disabled={addCookies.isPending || cookies < 1 || cookies > 5}
                    >
                      {addCookies.isPending ? "Sealing cookies…" : "Add encrypted cookies"}
                    </button>
                  </div>

                  <div className="d-flex flex-column flex-md-row gap-3">
                    <button
                      className="btn-outline-aurora flex-grow-1"
                      onClick={handleReveal}
                      disabled={revealButtonBusy}
                    >
                      {revealButtonBusy ? "Decrypting jar…" : revealButtonLabel}
                    </button>
                    <button
                      className="btn-outline-danger-aurora"
                      onClick={() => disconnect()}
                    >
                      Disconnect
                    </button>
                  </div>

                  {(addCookies.isError || revealTotal.isError || totalQuery.isError) && (
                    <p className="status-toast mb-0">
                      {(addCookies.error || revealError)?.message || "Something went wrong"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="text-center helper-text small mt-5 max-width-md mx-auto">
          Fully homomorphic encryption keeps every drop cloaked. We only light up the constellation when you call for the grand reveal.
        </footer>
      </div>
    </div>
  );
}
