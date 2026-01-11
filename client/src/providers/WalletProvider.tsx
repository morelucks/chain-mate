import { createAppKit, AppKitProvider } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig, http } from 'wagmi'
import { celo, celoAlfajores, base } from 'viem/chains'

// Configure Celo chains
const chains = [celoAlfajores, celo, base] as const

// Create wagmi config
const wagmiConfig = createConfig({
  chains,
  transports: {
    [celoAlfajores.id]: http(),
    [celo.id]: http(),
    [base.id]: http(),
  },
})

// Create React Query client
const queryClient = new QueryClient()

// AppKit metadata
const metadata = {
  name: 'CeloChess',
  description: 'On-chain chess on Celo',
  url: 'https://celochess.vercel.app',
  icons: ['https://celochess.vercel.app/logo.png'],
}

// Get WalletConnect Project ID from environment
const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID

// Validate that project ID is provided
if (!walletConnectProjectId || walletConnectProjectId === 'YOUR_PROJECT_ID') {
  console.error(
    '⚠️ VITE_WALLET_CONNECT_PROJECT_ID is not set. ' +
    'Please set it in your .env.local file. ' +
    'Get your project ID from https://cloud.reown.com'
  )
  // In production, you might want to throw an error instead
  if (import.meta.env.PROD) {
    throw new Error('VITE_WALLET_CONNECT_PROJECT_ID is required in production')
  }
}

// Create AppKit
export const appKit = createAppKit({
  wagmi: wagmiConfig,
  projectId: walletConnectProjectId || '0000000000000000000000000000000000000000', // Fallback for dev only
  metadata,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'x', 'github', 'apple'],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#10b981', // emerald-500
  },
  networks: chains,
})

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <AppKitProvider appKit={appKit}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AppKitProvider>
    </WagmiProvider>
  )
}

