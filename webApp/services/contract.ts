import {
    WalletAdapter,
    MessageSignerWalletAdapter,
    Transaction,
    WalletAdapterNetwork
} from "@demox-labs/aleo-wallet-adapter-base";

// ========================================
// CONFIGURATION (from environment variables)
// ========================================

// Program ID (contract address)
export const PRIVIDOCS_PROGRAM_ID =
    process.env.NEXT_PUBLIC_PROGRAM_ID || "prividocs_v1.aleo";

// Network configuration
export const NETWORK =
    process.env.NEXT_PUBLIC_NETWORK === "mainnet"
        ? WalletAdapterNetwork.TestnetBeta  // TODO: Change to MainnetBeta when deploying to mainnet
        : WalletAdapterNetwork.Testnet;

// Payment token (credits.aleo for testnet, usad.aleo for production)
export const PAYMENT_TOKEN =
    process.env.NEXT_PUBLIC_PAYMENT_TOKEN || "credits.aleo";

// Platform address (receives 2% fee)
export const PLATFORM_ADDRESS =
    process.env.NEXT_PUBLIC_PLATFORM_ADDRESS ||
    "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc";

// Video chunking configuration
export const MAX_CHUNKS = 32;
export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Struct matching the Leo ChunkCID struct
export interface ChunkCID {
    part1: string; // u128 as string
    part2: string; // u128 as string
}

export interface VideoMetadata {
    creator: string;
    price: number;
    chunkCount: number;
    chunks: ChunkCID[];
}

/**
 * Convert IPFS CID to two u128 parts for Leo
 * CIDv1 is typically 59 characters (base58), we need to split it into two u128 values
 */
export function cidToU128Parts(cid: string): { part1: string; part2: string } {
    // Convert CID string to bytes
    const encoder = new TextEncoder();
    const bytes = encoder.encode(cid);

    // Split into two halves
    const mid = Math.ceil(bytes.length / 2);
    const firstHalf = bytes.slice(0, mid);
    const secondHalf = bytes.slice(mid);

    // Convert each half to a BigInt (u128)
    let part1 = BigInt(0);
    let part2 = BigInt(0);

    for (let i = 0; i < firstHalf.length; i++) {
        part1 = (part1 << BigInt(8)) | BigInt(firstHalf[i]);
    }

    for (let i = 0; i < secondHalf.length; i++) {
        part2 = (part2 << BigInt(8)) | BigInt(secondHalf[i]);
    }

    return {
        part1: `${part1}u128`,
        part2: `${part2}u128`
    };
}

/**
 * Convert u128 parts back to CID string
 */
export function u128PartsToCid(part1: bigint, part2: bigint): string {
    const bytes1: number[] = [];
    const bytes2: number[] = [];

    let p1 = part1;
    while (p1 > BigInt(0)) {
        bytes1.unshift(Number(p1 & BigInt(0xFF)));
        p1 = p1 >> BigInt(8);
    }

    let p2 = part2;
    while (p2 > BigInt(0)) {
        bytes2.unshift(Number(p2 & BigInt(0xFF)));
        p2 = p2 >> BigInt(8);
    }

    const allBytes = new Uint8Array([...bytes1, ...bytes2]);
    const decoder = new TextDecoder();
    return decoder.decode(allBytes);
}

export async function buyVideo(
    videoId: string,
    creatorAddress: string,
    price: number,
    wallet: MessageSignerWalletAdapter
) {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    const transaction = Transaction.createTransaction(
        wallet.publicKey,
        NETWORK,
        PRIVIDOCS_PROGRAM_ID,
        "buy_access",
        [
            videoId,
            creatorAddress,
            `${price}u64`,
            "record1..." // In a real app, we need to fetch a valid credits record
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

/**
 * Publish a chunked video on-chain
 * @param videoId - Unique video identifier (field)
 * @param price - Price in credits (u64)
 * @param chunkCids - Array of IPFS CIDs for each chunk (max 32)
 * @param wallet - Connected wallet adapter
 */
export async function publishVideoOnChain(
    videoId: string,
    price: number,
    chunkCids: string[], // Array of IPFS CIDs for each chunk
    wallet: MessageSignerWalletAdapter
) {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    if (chunkCids.length === 0 || chunkCids.length > MAX_CHUNKS) {
        throw new Error(`Chunk count must be between 1 and ${MAX_CHUNKS}`);
    }

    // Convert each CID to ChunkCID struct format
    const chunks: ChunkCID[] = chunkCids.map(cid => cidToU128Parts(cid));

    // Pad array to exactly 32 elements (Leo requires fixed-size arrays)
    while (chunks.length < MAX_CHUNKS) {
        chunks.push({ part1: "0u128", part2: "0u128" });
    }

    // Build the chunks array string for Leo
    // Format: [ChunkCID { part1: 123u128, part2: 456u128 }, ...]
    const chunksArrayStr = "[" + chunks.map(chunk =>
        `ChunkCID { part1: ${chunk.part1}, part2: ${chunk.part2} }`
    ).join(", ") + "]";

    const transaction = Transaction.createTransaction(
        wallet.publicKey,
        NETWORK,
        PRIVIDOCS_PROGRAM_ID,
        "publish_video",
        [
            videoId,
            `${price}u64`,
            `${chunkCids.length}u8`, // chunk_count
            chunksArrayStr // chunks array
        ],
        500_000 // 0.5 Credit fee
    );

    return await wallet.requestTransaction(transaction);
}
