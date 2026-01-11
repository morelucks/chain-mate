// Contract addresses per network
export const MATCH_MANAGER_ADDRESSES = {
  // Base Mainnet
  8453: import.meta.env.VITE_MATCH_MANAGER_BASE || '0xAD473eaA51821c915D03D9dB5349A0586d55E55e',
  // Celo Mainnet
  42220: import.meta.env.VITE_MATCH_MANAGER_CELO || '0x8D092fd130323601de13AFF0D4BA8900c6ca9C9f',
  // Celo Sepolia
  44787: import.meta.env.VITE_MATCH_MANAGER_CELO_SEPOLIA || '0x3D15251E40A631793637B2DFD6433EaDEc821853',
} as const

export function getMatchManagerAddress(chainId?: number): `0x${string}` {
  if (!chainId) return MATCH_MANAGER_ADDRESSES[8453]
  return MATCH_MANAGER_ADDRESSES[chainId as keyof typeof MATCH_MANAGER_ADDRESSES] || MATCH_MANAGER_ADDRESSES[8453]
}

// Explorer URLs per network
export const EXPLORER_URLS = {
  8453: 'https://basescan.org',
  42220: 'https://celoscan.io',
  44787: 'https://sepolia.celoscan.io',
} as const

export function getExplorerUrl(chainId?: number, txHash?: string): string {
  const baseUrl = chainId ? EXPLORER_URLS[chainId as keyof typeof EXPLORER_URLS] : EXPLORER_URLS[8453]
  return txHash ? `${baseUrl}/tx/${txHash}` : baseUrl
}

