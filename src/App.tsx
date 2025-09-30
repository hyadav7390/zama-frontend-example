import { useState } from "react";
import { useCookieJar } from "./hooks/useCookieJar";

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
    <div className="min-vh-100 bg-dark text-light py-5">
      <div className="container">
        <header className="text-center mb-5">
          <h1 className="fw-bold display-5">Secret Cookie Jar</h1>
          <p className="text-secondary">
            Everyone drops cookies into the jar, but only the grand reveal shows how many treats the crew collected.
          </p>
        </header>

        <div className="card bg-secondary bg-opacity-25 border border-secondary-subtle shadow-sm">
          <div className="card-body p-4">
            {!isConnected ? (
              <div className="text-center">
                <p className="mb-3">Connect a wallet to add your encrypted cookies.</p>
                <button className="btn btn-primary" onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting ? "Connecting…" : "Connect Wallet"}
                </button>
                {!connectorsReady && (
                  <p className="text-danger small mt-3">
                    MetaMask extension not detected. Install it or open the app in a MetaMask-enabled browser.
                  </p>
                )}
                {connectError && (
                  <p className="text-danger small mt-3">{connectError.message}</p>
                )}
              </div>
            ) : (
              <div className="row g-4">
                <div className="col-12 d-flex justify-content-between align-items-center text-secondary">
                  <span>Wallet</span>
                  <span className="fw-semibold">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
                </div>

                <div className="col-12">
                  <div className="bg-dark rounded py-4 text-center border border-secondary-subtle">
                    <p className="text-secondary mb-2">Cookie jar status</p>
                    <div className="fs-1" aria-live="polite">
                      {jarDisplay}
                    </div>
                    {revealedTotal !== null ? (
                      <p className="mt-3 text-success fw-semibold">
                        🍪 Total cookies collected: {revealedTotal}
                      </p>
                    ) : (
                      <p className="mt-3 text-secondary">
                        Nobody knows the total yet — contributions stay secret until you reveal them.
                      </p>
                    )}
                  </div>
                </div>

                <div className="col-md-6 d-flex gap-2 align-items-center">
                  <label className="form-label mb-0 text-secondary" htmlFor="cookie-input">
                    Your cookies
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
                <div className="col-md-6 d-grid gap-2">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => addCookies.mutate(cookies)}
                    disabled={addCookies.isPending || cookies < 1 || cookies > 5}
                  >
                    {addCookies.isPending ? "Dropping cookies…" : "Add cookies"}
                  </button>
                  {(addCookies.isError || revealTotal.isError || totalQuery.isError) && (
                    <p className="text-danger small mb-0">
                      {(addCookies.error || revealError)?.message || "Something went wrong"}
                    </p>
                  )}
                </div>

                <div className="col-12 d-flex gap-2">
                  <button
                    className="btn btn-outline-light flex-grow-1"
                    onClick={handleReveal}
                    disabled={revealButtonBusy}
                  >
                    {revealButtonBusy ? "Decrypting jar…" : revealButtonLabel}
                  </button>
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => disconnect()}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="text-center text-secondary small mt-4">
          Each drop stays private thanks to homomorphic encryption. Only the final reveal uncovers the cookie bounty.
        </footer>
      </div>
    </div>
  );
}