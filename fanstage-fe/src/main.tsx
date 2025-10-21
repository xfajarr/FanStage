import { createRoot } from "react-dom/client";
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import App from "./App.tsx";
import "./index.css";
import { config } from './wagmi';

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider
          appId={import.meta.env.VITE_PRIVY_APP_ID ?? ""}
          config={{
            loginMethods: ["wallet", "email", "twitter", "google"],
            appearance: {
              theme: 'light',
              accentColor: '#676FFF'
            },
            embeddedWallets: {
              ethereum: {
                createOnLogin: 'users-without-wallets'
              }
            },
            defaultChain: {
              id: 84532,
              name: 'Base Sepolia',
              rpcUrls: {
                default: { http: ['https://sepolia.base.org'] }
              },
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              blockExplorers: {
                default: { name: 'Base Sepolia Explorer', url: 'https://sepolia.basescan.org' }
              },
            },
            supportedChains: [
              {
                id: 84532,
                name: 'Base Sepolia',
                rpcUrls: {
                  default: { http: ['https://sepolia.base.org'] }
                },
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorers: {
                  default: { name: 'Base Sepolia Explorer', url: 'https://sepolia.basescan.org' }
                },
              },
              {
                id: 1,
                name: 'Ethereum Mainnet',
                rpcUrls: {
                  default: { http: ['https://eth-mainnet.g.alchemy.com/v2/demo'] }
                },
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorers: {
                  default: { name: 'Etherscan', url: 'https://etherscan.io' }
                },
              },
            ],
          }}
        >
          <App />
        </PrivyProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
