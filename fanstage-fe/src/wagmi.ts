import { createConfig, http } from 'wagmi';
import { baseSepolia, mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia, mainnet],
  connectors: [
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: false,
});