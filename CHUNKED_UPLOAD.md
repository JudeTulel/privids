# Chunked Video Upload Guide

## Overview

The PriviDocs smart contract now supports **chunked video uploads** with the following specifications:

- **Chunk Size**: 5MB per chunk
- **Maximum Chunks**: 32 chunks per video
- **Maximum Video Size**: 160MB (32 chunks × 5MB)

## Smart Contract Changes

### Data Structures

#### ChunkCID Struct
```leo
struct ChunkCID {
    part1: u128,
    part2: u128
}
```
Each IPFS CID is split into two u128 values for storage on-chain.

#### VideoMetadata Struct
```leo
struct VideoMetadata {
    creator: address,
    price: u64,
    chunk_count: u8,          // Number of chunks (1-32)
    chunks: [ChunkCID; 32]    // Fixed-size array of chunk CIDs
}
```

### Publishing a Video

```leo
transition publish_video(
    public video_id: field,
    public price: u64,
    public chunk_count: u8,
    public chunks: [ChunkCID; 32]
) -> Future
```

**Parameters:**
- `video_id`: Unique identifier for the video
- `price`: Price in credits to access the video
- `chunk_count`: Number of chunks (1-32)
- `chunks`: Array of 32 ChunkCID structs (unused slots filled with zeros)

## Frontend Implementation

### Step 1: Split Video into Chunks

```typescript
import { CHUNK_SIZE } from './services/contract';

async function splitVideoIntoChunks(file: File): Promise<Blob[]> {
    const chunks: Blob[] = [];
    let offset = 0;
    
    while (offset < file.size) {
        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        chunks.push(chunk);
        offset += CHUNK_SIZE;
    }
    
    return chunks;
}
```

### Step 2: Upload Chunks to IPFS

```typescript
import { create } from 'ipfs-http-client';

async function uploadChunksToIPFS(chunks: Blob[]): Promise<string[]> {
    const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });
    const cids: string[] = [];
    
    for (const chunk of chunks) {
        const result = await ipfs.add(chunk);
        cids.push(result.path);
    }
    
    return cids;
}
```

### Step 3: Publish to Blockchain

```typescript
import { publishVideoOnChain } from './services/contract';

async function publishVideo(
    videoFile: File,
    price: number,
    wallet: MessageSignerWalletAdapter
) {
    // 1. Split video into chunks
    const chunks = await splitVideoIntoChunks(videoFile);
    
    if (chunks.length > 32) {
        throw new Error('Video too large! Maximum 32 chunks (160MB)');
    }
    
    // 2. Upload chunks to IPFS
    const chunkCids = await uploadChunksToIPFS(chunks);
    
    // 3. Generate unique video ID
    const videoId = `${Date.now()}field`;
    
    // 4. Publish to blockchain
    const txId = await publishVideoOnChain(
        videoId,
        price,
        chunkCids,
        wallet
    );
    
    console.log('Video published! Transaction ID:', txId);
    return { videoId, chunkCids, txId };
}
```

### Step 4: Retrieve and Reconstruct Video

```typescript
import { u128PartsToCid } from './services/contract';

async function retrieveVideo(videoMetadata: VideoMetadata): Promise<Blob> {
    const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });
    const chunks: Uint8Array[] = [];
    
    // Get only the actual chunks (not the padded zeros)
    for (let i = 0; i < videoMetadata.chunkCount; i++) {
        const chunk = videoMetadata.chunks[i];
        
        // Convert u128 parts back to CID
        const cid = u128PartsToCid(
            BigInt(chunk.part1.replace('u128', '')),
            BigInt(chunk.part2.replace('u128', ''))
        );
        
        // Download chunk from IPFS
        const stream = ipfs.cat(cid);
        const chunkData: Uint8Array[] = [];
        
        for await (const data of stream) {
            chunkData.push(data);
        }
        
        chunks.push(...chunkData);
    }
    
    // Reconstruct the complete video
    return new Blob(chunks, { type: 'video/mp4' });
}
```

## Complete Example

```typescript
import { useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';

export function VideoUploadComponent() {
    const { wallet } = useWallet();
    const [uploading, setUploading] = useState(false);
    
    async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file || !wallet) return;
        
        setUploading(true);
        
        try {
            // Split into chunks
            const chunks = await splitVideoIntoChunks(file);
            console.log(`Split into ${chunks.length} chunks`);
            
            // Upload to IPFS
            const chunkCids = await uploadChunksToIPFS(chunks);
            console.log('Uploaded to IPFS:', chunkCids);
            
            // Publish on-chain
            const videoId = `${Date.now()}field`;
            const price = 100; // 100 credits
            
            const txId = await publishVideoOnChain(
                videoId,
                price,
                chunkCids,
                wallet.adapter as MessageSignerWalletAdapter
            );
            
            console.log('Published! TX:', txId);
            alert('Video published successfully!');
            
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    }
    
    return (
        <div>
            <input
                type="file"
                accept="video/*"
                onChange={handleUpload}
                disabled={uploading}
            />
            {uploading && <p>Uploading... Please wait</p>}
        </div>
    );
}
```

## Platform Fee

Every video purchase includes a **2% platform fee**:

- **Creator receives**: 98% of the price
- **Platform receives**: 2% of the price

Example: If a video costs 100 credits:
- Creator gets: 98 credits
- Platform gets: 2 credits

## Important Notes

1. **Fixed Array Size**: Leo requires fixed-size arrays, so all 32 slots must be filled. Unused slots are padded with `ChunkCID { part1: 0u128, part2: 0u128 }`.

2. **Chunk Count**: The `chunk_count` field tells you how many chunks are actually used (1-32).

3. **CID Encoding**: IPFS CIDs are encoded as two u128 values using the `cidToU128Parts()` helper function.

4. **Gas Costs**: Larger videos (more chunks) will cost more gas to publish on-chain.

5. **Platform Address**: Remember to update `PLATFORM_ADDRESS` in the smart contract before deployment!

## Testing

To test the contract locally:

```bash
cd contracts/prividocs
leo build
leo test
```

## Next Steps

1. Update the platform address in `main.leo` (line 18)
2. Build and deploy the contract
3. Update frontend components to use the new chunked upload flow
4. Test with various video sizes
