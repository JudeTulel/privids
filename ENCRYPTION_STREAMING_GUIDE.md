# Encryption & Streaming Architecture

## 🔐 The Challenge: Encryption vs Streaming

### **Traditional Encryption (Your Current Setup)**

**Problem:** AES-GCM encrypts the ENTIRE file as one block.

```
┌─────────────────────────────────────┐
│   Entire Video (100MB)              │
│   Encrypted as ONE block            │
│   ❌ Must download ALL before play  │
└─────────────────────────────────────┘
```

**Issues:**
- ❌ No streaming possible
- ❌ Must download entire file first
- ❌ High memory usage
- ❌ Slow time-to-first-frame
- ❌ Can't seek/skip in video

---

## ✅ The Solution: Per-Chunk Encryption

### **Streaming-Compatible Encryption**

Encrypt each 5MB chunk **independently** with its own IV (Initialization Vector).

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Chunk 0  │ │ Chunk 1  │ │ Chunk 2  │ │ Chunk 3  │
│ 5MB      │ │ 5MB      │ │ 5MB      │ │ 5MB      │
│ IV: abc  │ │ IV: def  │ │ IV: ghi  │ │ IV: jkl  │
│ ✅ Stream │ │ ✅ Stream │ │ ✅ Stream │ │ ✅ Stream │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Benefits:**
- ✅ Stream chunks as they arrive
- ✅ Random access (seek to any chunk)
- ✅ Low memory footprint
- ✅ Instant playback start
- ✅ Progressive download

---

## 🏗️ Architecture Overview

### **Upload Flow (Creator)**

```
1. Video File (100MB)
   ↓
2. Split into chunks (20 chunks × 5MB)
   ↓
3. Encrypt each chunk independently
   │  Chunk 0 + IV₀ → Encrypted Chunk 0
   │  Chunk 1 + IV₁ → Encrypted Chunk 1
   │  ...
   ↓
4. Upload encrypted chunks to IPFS
   │  → CID₀, CID₁, CID₂, ...
   ↓
5. Store on blockchain:
   │  - Array of CIDs (on-chain)
   ↓
6. Store in Access Node:
   │  - Encryption key (off-chain, secure)
   │  - Array of IVs (off-chain)
```

### **Playback Flow (Viewer)**

```
1. Fetch video metadata from blockchain
   │  → Get array of chunk CIDs
   ↓
2. Request decryption key from Access Node
   │  → Verify AccessCard NFT
   │  → Return: encryption key + IVs array
   ↓
3. Stream and decrypt chunks progressively
   │  Fetch CID₀ → Decrypt with IV₀ → Play
   │  Fetch CID₁ → Decrypt with IV₁ → Buffer
   │  Fetch CID₂ → Decrypt with IV₂ → Buffer
   │  ...
   ↓
4. Video plays while downloading!
```

---

## 📊 Comparison

| Feature | Full-File Encryption | Per-Chunk Encryption |
|---------|---------------------|---------------------|
| **Streaming** | ❌ No | ✅ Yes |
| **Memory Usage** | ❌ High (entire file) | ✅ Low (5MB chunks) |
| **Time to Play** | ❌ Slow (wait for full download) | ✅ Fast (start immediately) |
| **Seeking** | ❌ Must decrypt from start | ✅ Jump to any chunk |
| **Security** | ✅ Strong | ✅ Strong (same AES-256) |
| **Complexity** | ✅ Simple | ⚠️ Moderate (manage IVs) |

---

## 🔧 Implementation Details

### **Data Structures**

#### On-Chain (Blockchain)
```leo
struct VideoMetadata {
    creator: address,
    price: u64,
    chunk_count: u8,           // e.g., 20
    chunks: [ChunkCID; 32]     // CIDs of encrypted chunks
}
```

#### Off-Chain (Access Node)
```typescript
interface EncryptionMetadata {
    key: string;              // AES-256 key (base64)
    chunkIVs: string[];       // Array of IVs, one per chunk
    totalChunks: number;      // e.g., 20
}
```

### **Why Store IVs Off-Chain?**

1. **Cost**: IVs are 12 bytes each. For 32 chunks = 384 bytes. Expensive on-chain!
2. **Privacy**: IVs don't need to be public
3. **Flexibility**: Can update encryption without changing blockchain data

---

## 🎬 Video Playback Strategies

### **Strategy 1: Blob URL (Simple)**
Best for: Videos < 100MB

```typescript
// Decrypt all chunks, create blob URL
const videoUrl = await streamingEncryption.createBlobVideoUrl(
    chunkCids,
    encryptionKey,
    chunkIVs
);

videoElement.src = videoUrl;
```

**Pros:** Simple, works everywhere  
**Cons:** Must download all chunks before playback

---

### **Strategy 2: MediaSource API (Advanced)**
Best for: Videos > 100MB, true streaming

```typescript
// Progressive streaming with MediaSource
const videoUrl = await streamingEncryption.createStreamableVideoUrl(
    chunkCids,
    encryptionKey,
    chunkIVs
);

videoElement.src = videoUrl;
```

**Pros:** True streaming, low memory  
**Cons:** More complex, browser support varies

---

### **Strategy 3: HLS/DASH (Production)**
Best for: Production apps, adaptive bitrate

```
1. Encrypt chunks
2. Generate HLS playlist (.m3u8)
3. Use video.js or hls.js for playback
4. Decrypt chunks on-the-fly
```

**Pros:** Industry standard, adaptive quality  
**Cons:** Requires HLS infrastructure

---

## 🔒 Security Considerations

### **What's Encrypted?**
- ✅ Video chunks (AES-256-GCM)
- ✅ Each chunk independently encrypted

### **What's Public?**
- ✅ Chunk CIDs (on IPFS, but encrypted)
- ✅ Video metadata (creator, price, chunk count)

### **What's Private?**
- 🔐 Encryption key (Access Node only)
- 🔐 IVs array (Access Node only)
- 🔐 Decrypted video content

### **Access Control**
```
User wants to watch video
  ↓
Check: Does user have AccessCard NFT?
  ↓ YES
Access Node returns: encryption key + IVs
  ↓
User can decrypt and watch
```

---

## 📈 Performance Metrics

### **Upload Performance**
- **Chunk Size**: 5MB
- **Encryption Speed**: ~50MB/s (modern browser)
- **100MB video**: ~2 seconds to encrypt
- **IPFS Upload**: Depends on connection (parallel uploads possible)

### **Playback Performance**
- **Time to First Frame**: 1-2 seconds (fetch + decrypt first chunk)
- **Buffering**: Minimal (decrypt chunks as they arrive)
- **Memory Usage**: ~15-20MB (3-4 chunks buffered)

---

## 🚀 Migration Path

### **Current State (Full-File Encryption)**
```typescript
// ipfs-service.ts (lines 73-90)
const { encryptedBlob, iv } = await this.encryptFile(file, key);
// ❌ Encrypts entire file
```

### **New State (Per-Chunk Encryption)**
```typescript
// streaming-encryption.ts
const { encryptedChunks, metadata } = await streamingEncryption.encryptFileInChunks(file);
// ✅ Encrypts each chunk independently
```

### **Migration Steps**

1. **Update Upload Flow**
   - Replace `encryptFile()` with `encryptFileInChunks()`
   - Upload each encrypted chunk to IPFS separately
   - Store chunk CIDs on blockchain
   - Store encryption key + IVs in Access Node

2. **Update Access Node**
   - Add endpoint to store/retrieve IVs array
   - Update key storage to include IVs

3. **Update Playback Flow**
   - Fetch chunk CIDs from blockchain
   - Fetch encryption key + IVs from Access Node
   - Use `streamDecryptedChunks()` for progressive playback

4. **Test**
   - Upload test video
   - Verify streaming works
   - Check memory usage
   - Test seeking/skipping

---

## 💡 Best Practices

### **Chunk Size Selection**
- **5MB**: ✅ Good balance (recommended)
- **1MB**: ⚠️ Too many chunks, high overhead
- **10MB**: ⚠️ Slower initial playback

### **Buffering Strategy**
- Buffer 3-5 chunks ahead
- Pre-fetch next chunk while playing current
- Clear old chunks from memory

### **Error Handling**
- Retry failed chunk downloads (3 attempts)
- Skip corrupted chunks gracefully
- Show user-friendly error messages

### **Optimization**
- Parallel chunk downloads (2-3 at a time)
- Cache decrypted chunks in memory
- Use Web Workers for decryption (offload from main thread)

---

## 🎯 Recommended Approach

For **PriviDocs**, I recommend:

1. **Use per-chunk encryption** (streaming-encryption.ts)
2. **5MB chunk size** (matches your blockchain limit)
3. **Blob URL strategy** for MVP (simpler)
4. **Upgrade to MediaSource** for production (better UX)

This gives you:
- ✅ True streaming capability
- ✅ Works with your 32-chunk limit
- ✅ Maintains strong encryption
- ✅ Great user experience

---

## 📝 Next Steps

1. ✅ Review `streaming-encryption.ts` implementation
2. ⬜ Update `ipfs-service.ts` to use per-chunk encryption
3. ⬜ Update Access Node to store IVs
4. ⬜ Update video player component
5. ⬜ Test with real videos
6. ⬜ Deploy and verify

---

## ❓ FAQ

**Q: Is per-chunk encryption as secure as full-file encryption?**  
A: Yes! Each chunk uses AES-256-GCM, which is industry-standard encryption. The only difference is granularity.

**Q: Can someone decrypt chunks without the key?**  
A: No. Without the encryption key, the chunks are just random data.

**Q: What if someone has chunk 5 but not the key?**  
A: They can't decrypt it. Each chunk requires both the key AND its specific IV.

**Q: Can I seek to the middle of a video?**  
A: Yes! Just fetch and decrypt the chunk at that timestamp. No need to download earlier chunks.

**Q: What about bandwidth costs?**  
A: Same as before. You're still downloading the same amount of data, just in a streamable format.
