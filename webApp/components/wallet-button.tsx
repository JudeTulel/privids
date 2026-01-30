'use client'

import React from 'react'
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui'

// The WalletMultiButton handles connection state, modal triggering, and disconnecting.
// It supports multiple wallets (Leo, Puzzle) via the standard adapter interface.
// Styles are imported in the WalletProvider.

export function WalletButton() {
  return (
    <WalletMultiButton className="bg-accent text-accent-foreground hover:bg-accent/90" />
  )
}
