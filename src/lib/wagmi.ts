import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const RPC_URL = import.meta.env.VITE_RPC_URL;
const sepoliaTransport = RPC_URL ? http(RPC_URL) : http();

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    injected({ target: "metaMask" }),
  ],
  transports: {
    [sepolia.id]: sepoliaTransport,
  },
});
