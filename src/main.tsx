import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import process from "process";
import { Buffer } from "buffer";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { wagmiConfig } from "./lib/wagmi";

const queryClient = new QueryClient();

if (typeof window !== "undefined") {
  Object.assign(window, { process, Buffer });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
