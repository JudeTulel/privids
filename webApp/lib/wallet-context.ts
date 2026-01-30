'use client'

import { createContext, useContext, ReactNode } from 'react'

// Wallet context types and utilities for Puzzle SDK integration
export interface WalletAccount {
  address: string
  publicKey: string
  isConnected: boolean
}

export interface WalletState {
  account: WalletAccount | null
  isConnecting: boolean
  error: string | null
}

export const initialWalletState: WalletState = {
  account: null,
  isConnecting: false,
  error: null,
}



// Puzzle SDK Integration
// The Aleo wallet extension injects window.aleo
// Users must install a compatible wallet extension

export interface AleoWindow extends Window {
  aleo?: {
    requestAccount: () => Promise<string>
    getAccount: () => Promise<string | null>
    isConnected: () => Promise<boolean>
    requestSignMessage: (message: string) => Promise<string>
    requestSignTransaction: (transaction: string) => Promise<string>
    decrypt: (ciphertext: string) => Promise<string>
    on: (event: string, callback: (data: any) => void) => void
    off: (event: string, callback: (data: any) => void) => void
  }
}

declare global {
  interface Window {
    aleo?: AleoWindow['aleo']
  }
}

/**
 * Connect to Aleo wallet via Puzzle SDK
 */
export async function connectWallet(): Promise<string> {
  if (!window.aleo) {
    throw new Error(
      'Aleo wallet not found. Please install the Aleo wallet extension.'
    )
  }

  try {
    const account = await window.aleo.requestAccount()
    console.log('[v0] Wallet connected:', account)
    return account
  } catch (error) {
    console.error('[v0] Wallet connection failed:', error)
    throw error
  }
}

/**
 * Get current connected account
 */
export async function getAccount(): Promise<string | null> {
  if (!window.aleo) {
    return null
  }

  try {
    return await window.aleo.getAccount()
  } catch (error) {
    console.error('[v0] Failed to get account:', error)
    return null
  }
}

/**
 * Check if wallet is connected
 */
export async function isWalletConnected(): Promise<boolean> {
  if (!window.aleo) {
    return false
  }

  try {
    return await window.aleo.isConnected()
  } catch (error) {
    return false
  }
}

/**
 * Sign a message with the wallet
 */
export async function signMessage(message: string): Promise<string> {
  if (!window.aleo) {
    throw new Error('Aleo wallet not found')
  }

  try {
    const signature = await window.aleo.requestSignMessage(message)
    return signature
  } catch (error) {
    console.error('[v0] Message signing failed:', error)
    throw error
  }
}

/**
 * Decrypt content with wallet (for private access records)
 */
export async function decryptContent(ciphertext: string): Promise<string> {
  if (!window.aleo) {
    throw new Error('Aleo wallet not found')
  }

  try {
    const plaintext = await window.aleo.decrypt(ciphertext)
    return plaintext
  } catch (error) {
    console.error('[v0] Decryption failed:', error)
    throw error
  }
}
