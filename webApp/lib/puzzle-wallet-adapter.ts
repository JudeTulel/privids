'use client'

import {
    BaseMessageSignerWalletAdapter,
    DecryptPermission,
    WalletAdapterNetwork,
    WalletDecryptionNotAllowedError,
    WalletDisconnectionError,
    WalletName,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletReadyState,
    WalletSignTransactionError,
} from '@demox-labs/aleo-wallet-adapter-base'

export interface PuzzleWalletAdapterConfig {
    appName?: string
}

export const PuzzleWalletName = 'Puzzle Wallet' as WalletName<'Puzzle Wallet'>

// Check if Puzzle wallet is available
declare global {
    interface Window {
        puzzle?: {
            connect: () => Promise<string>
            disconnect: () => Promise<void>
            getAccount: () => Promise<string | null>
            isConnected: () => Promise<boolean>
            signMessage: (message: string) => Promise<string>
            requestTransaction: (transaction: any) => Promise<string>
            decrypt: (ciphertext: string) => Promise<string>
            on: (event: string, callback: (data: any) => void) => void
            off: (event: string, callback: (data: any) => void) => void
        }
    }
}

export class PuzzleWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = PuzzleWalletName
    url = 'https://puzzle.online'
    icon =
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI0IiBmaWxsPSIjNkM1Q0U3Ii8+PHBhdGggZD0iTTcgN2gxMHYxMEg3eiIgZmlsbD0id2hpdGUiLz48L3N2Zz4='

    // Required properties for BaseMessageSignerWalletAdapter
    readonly supportedTransactionVersions = null

    private _connecting: boolean = false
    private _publicKey: string | null = null
    private _decryptPermission: DecryptPermission = DecryptPermission.NoDecrypt
    private _readyState: WalletReadyState = WalletReadyState.NotDetected

    constructor(config: PuzzleWalletAdapterConfig = {}) {
        super()

        // Check if we're in the browser
        if (typeof window !== 'undefined') {
            // Check for wallet on load and periodically
            this._checkWallet()

            // Also check after a short delay (wallet extension might inject later)
            setTimeout(() => this._checkWallet(), 100)
            setTimeout(() => this._checkWallet(), 500)
            setTimeout(() => this._checkWallet(), 1000)
        }
    }

    private _checkWallet(): void {
        if (typeof window !== 'undefined' && window.puzzle) {
            this._readyState = WalletReadyState.Installed
            this.emit('readyStateChange', this._readyState)
        }
    }

    get publicKey(): string | null {
        return this._publicKey
    }

    get decryptPermission(): DecryptPermission {
        return this._decryptPermission
    }

    get connecting(): boolean {
        return this._connecting
    }

    get readyState(): WalletReadyState {
        return this._readyState
    }

    async connect(
        decryptPermission: DecryptPermission = DecryptPermission.NoDecrypt,
        network: WalletAdapterNetwork = WalletAdapterNetwork.TestnetBeta
    ): Promise<void> {
        try {
            if (this.connected || this.connecting) return

            if (this._readyState !== WalletReadyState.Installed) {
                throw new WalletNotReadyError()
            }

            this._connecting = true

            const puzzle = window.puzzle
            if (!puzzle) {
                throw new WalletNotReadyError()
            }

            try {
                const account = await puzzle.connect()
                this._publicKey = account
                this._decryptPermission = decryptPermission
                this.emit('connect', this._publicKey)
            } catch (error: any) {
                throw new WalletNotConnectedError(error?.message)
            }
        } catch (error: any) {
            this.emit('error', error)
            throw error
        } finally {
            this._connecting = false
        }
    }

    async disconnect(): Promise<void> {
        const puzzle = window.puzzle

        if (puzzle) {
            try {
                await puzzle.disconnect()
            } catch (error: any) {
                this.emit('error', new WalletDisconnectionError(error?.message))
            }
        }

        this._publicKey = null
        this.emit('disconnect')
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const puzzle = window.puzzle

            if (!puzzle) {
                throw new WalletNotConnectedError()
            }

            const messageStr = new TextDecoder().decode(message)
            const signature = await puzzle.signMessage(messageStr)
            return new TextEncoder().encode(signature)
        } catch (error: any) {
            this.emit('error', new WalletSignTransactionError(error?.message))
            throw error
        }
    }

    async decrypt(
        ciphertext: string,
        tpk?: string,
        programId?: string,
        functionName?: string,
        index?: number
    ): Promise<string> {
        try {
            const puzzle = window.puzzle

            if (!puzzle) {
                throw new WalletNotConnectedError()
            }

            if (this._decryptPermission === DecryptPermission.NoDecrypt) {
                throw new WalletDecryptionNotAllowedError()
            }

            return await puzzle.decrypt(ciphertext)
        } catch (error: any) {
            this.emit('error', error)
            throw error
        }
    }

    async requestViewKey(): Promise<string> {
        throw new Error('View key request not supported by Puzzle Wallet')
    }

    async requestRecords(program: string): Promise<any[]> {
        throw new Error('Records request not supported via adapter')
    }

    async requestTransaction(transaction: any): Promise<string> {
        try {
            const puzzle = window.puzzle

            if (!puzzle) {
                throw new WalletNotConnectedError()
            }

            return await puzzle.requestTransaction(transaction)
        } catch (error: any) {
            this.emit('error', new WalletSignTransactionError(error?.message))
            throw error
        }
    }

    async requestExecution(transaction: any): Promise<string> {
        return this.requestTransaction(transaction)
    }

    async requestBulkTransactions(transactions: any[]): Promise<string[]> {
        throw new Error('Bulk transactions not supported by Puzzle Wallet adapter')
    }

    async requestDeploy(deployment: any): Promise<string> {
        throw new Error('Deploy not supported by Puzzle Wallet adapter')
    }

    async transactionStatus(transactionId: string): Promise<string> {
        throw new Error('Transaction status not supported by adapter')
    }

    async getExecution(transactionId: string): Promise<any> {
        throw new Error('Get execution not supported by adapter')
    }

    async requestRecordPlaintexts(program: string): Promise<any[]> {
        throw new Error('Record plaintexts not supported by adapter')
    }

    async requestTransactionHistory(program: string): Promise<any[]> {
        throw new Error('Transaction history not supported by adapter')
    }

    async transitionViewKeys(transactionId: string): Promise<string[]> {
        throw new Error('Transition view keys not supported by adapter')
    }
}
