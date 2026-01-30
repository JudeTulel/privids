import {
    WalletAdapter,
    MessageSignerWalletAdapter,
    Transaction,
    WalletAdapterNetwork
} from "@demox-labs/aleo-wallet-adapter-base";

export const PRIVIDOCS_PROGRAM_ID = "prividocs_v1.aleo";

export interface VideoMetadata {
    creator: string;
    price: number;
    ipfsCid: string; // Combined
}

export async function buyVideo(
    videoId: string,
    price: number,
    wallet: MessageSignerWalletAdapter
) {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    const amountMicroCredits = price * 1_000_000; // Assuming price is in credits, convert to microcredits if needed
    // However, our contract takes u64 amount, let's assume raw units for now.

    const transaction = Transaction.createTransaction(
        wallet.publicKey,
        WalletAdapterNetwork.Testnet,
        PRIVIDOCS_PROGRAM_ID,
        "buy_access",
        [
            videoId,
            "record1...", // In a real app, we need to fetch a valid credits record
            `${price}u64`
        ],
        1_000_000 // 1 Credit fee
    );

    try {
        const txId = await wallet.requestTransaction(transaction);
        return txId;
    } catch (err) {
        console.error("Buy Transaction Failed:", err);
        throw err;
    }
}

export async function publishVideoOnChain(
    videoId: string,
    price: number,
    cid: string,
    wallet: MessageSignerWalletAdapter
) {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    // Split CID if needed, for now mocking the split
    const cidPart1 = "123456789u128";
    const cidPart2 = "987654321u128";

    const transaction = Transaction.createTransaction(
        wallet.publicKey,
        WalletAdapterNetwork.Testnet,
        PRIVIDOCS_PROGRAM_ID,
        "publish_video",
        [
            videoId,
            `${price}u64`,
            cidPart1,
            cidPart2
        ],
        500_000 // 0.5 Credit fee
    );

    return await wallet.requestTransaction(transaction);
}
