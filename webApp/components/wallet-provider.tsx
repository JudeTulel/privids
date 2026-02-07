'use client'

import React, { useMemo } from 'react'
import { WalletProvider as AleoWalletProvider } from '@demox-labs/aleo-wallet-adapter-react'
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui'
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo'
import { PuzzleWalletAdapter } from '@/lib/puzzle-wallet-adapter'
import { useWallet as useAleoWallet } from '@demox-labs/aleo-wallet-adapter-react'

// Import styles for the wallet modal
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css'

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: 'PriviDocs',
      }),
      new PuzzleWalletAdapter({
        appName: 'PriviDocs',
      }),
    ],
    []
  )

  return (
    <AleoWalletProvider
      wallets={wallets}
      autoConnect
    >
      <WalletModalProvider>
        {children}
      </WalletModalProvider>
    </AleoWalletProvider>
  )
}

// Re-export the hook
export const useWallet = useAleoWallet
