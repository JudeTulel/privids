# 🔐 Privacy & Security Model

## ❓ Your Question: "Can someone view the files on IPFS?"

**Short Answer:** Yes, they can **download** the files, but they'll only see **encrypted garbage** without the decryption keys.

---

## 🔍 What's Public vs Private

### **✅ PUBLIC (Visible On-Chain)**

#### 1. **Video Metadata**
```leo
struct VideoMetadata {
    creator: address,        // ✅ PUBLIC
    price: u64,              // ✅ PUBLIC
    chunk_count: u8,         // ✅ PUBLIC
    chunks: [ChunkCID; 32]   // ✅ PUBLIC (IPFS CIDs)
}
```

**Anyone can see:**
- Who created the video
- How much it costs
- How many chunks it has
- The IPFS CIDs of encrypted chunks

#### 2. **Chunk CIDs on IPFS**
```
Chunk 0: QmXxx...abc (PUBLIC on IPFS)
Chunk 1: QmYyy...def (PUBLIC on IPFS)
Chunk 2: QmZzz...ghi (PUBLIC on IPFS)
```

**Anyone can:**
- ✅ See the CIDs on blockchain
- ✅ Download encrypted chunks from IPFS
- ✅ View file size and metadata

---

### **🔒 PRIVATE (NOT Visible)**

#### 1. **Encryption Keys**
```typescript
// Stored in Access Node (OFF-CHAIN)
{
    encryptionKey: "base64_encoded_aes_key",  // 🔒 PRIVATE
    chunkIVs: [                               // 🔒 PRIVATE
        "iv_for_chunk_0",
        "iv_for_chunk_1",
        ...
    ]
}
```

**Only accessible if:**
- ❌ You have an AccessCard NFT
- ❌ Access Node verifies your ownership
- ❌ You request keys with valid signature

#### 2. **Decrypted Video Content**
```
Original Video: "My Secret Documentary.mp4"  // 🔒 PRIVATE
```

**Cannot be accessed without:**
- ❌ Encryption key
- ❌ Correct IVs for each chunk
- ❌ Decryption algorithm (AES-256-GCM)

---

## 🛡️ Security Layers

### **Layer 1: Encryption (AES-256-GCM)**

```
Original Chunk → [AES-256 Encrypt] → Encrypted Chunk
    ↓                                      ↓
"Hello World"                    "x7f9a2b3c4d5e6f7..."
(Readable)                       (Garbage without key)
```

**What attackers see on IPFS:**
```
$ ipfs cat QmXxx...abc
x7f9a2b3c4d5e6f7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0...
(Random encrypted bytes - useless without key)
```

### **Layer 2: Off-Chain Key Storage**

```
Blockchain (PUBLIC)          Access Node (PRIVATE)
├─ Video CIDs               ├─ Encryption Keys
├─ Creator Address          ├─ IVs Array
├─ Price                    └─ Access Control
└─ Chunk Count
```

**Key never touches blockchain!**

### **Layer 3: NFT-Based Access Control**

```
User wants to watch video
    ↓
Check: Does user own AccessCard NFT?
    ↓ YES
Access Node returns keys
    ↓
User can decrypt and watch
```

---

## 🎭 Threat Model Analysis

### **Scenario 1: Random Person Finds CID**

**What they can do:**
```bash
# Download encrypted chunk
ipfs cat QmXxx...abc > chunk_0.enc

# Try to view it
cat chunk_0.enc
# Output: �����������... (garbage)

# Try to play it
vlc chunk_0.enc
# Output: "Cannot read file format"
```

**What they CANNOT do:**
- ❌ Decrypt the chunk (no key)
- ❌ View the video content
- ❌ Extract any meaningful data
- ❌ Reverse engineer the encryption

**Result:** ✅ **SECURE** - They see nothing useful

---

### **Scenario 2: Attacker Scrapes All CIDs from Blockchain**

**What they can do:**
```javascript
// Scrape all video CIDs from blockchain
const allVideos = await fetchAllVideosFromBlockchain();

// Download all encrypted chunks
for (const video of allVideos) {
    for (const cid of video.chunks) {
        await downloadFromIPFS(cid);
    }
}
```

**What they have:**
- ✅ Gigabytes of encrypted data
- ✅ Metadata (creator, price, chunk count)

**What they DON'T have:**
- ❌ Encryption keys
- ❌ IVs for each chunk
- ❌ Ability to decrypt anything

**Result:** ✅ **SECURE** - Useless encrypted data

---

### **Scenario 3: Attacker Compromises IPFS Gateway**

**What they can do:**
- ✅ See all file requests
- ✅ Track which CIDs are popular
- ✅ Monitor download patterns

**What they CANNOT do:**
- ❌ Decrypt the content
- ❌ Access encryption keys (stored in Access Node)
- ❌ View actual video content

**Result:** ✅ **SECURE** - Only metadata leakage

---

### **Scenario 4: Legitimate User Buys Access**

**What happens:**
```
1. User buys video → Gets AccessCard NFT
2. User requests playback
3. Frontend checks: "Does user own AccessCard?"
4. YES → Request keys from Access Node
5. Access Node verifies NFT ownership
6. Access Node returns: encryption key + IVs
7. Frontend downloads encrypted chunks from IPFS
8. Frontend decrypts chunks in browser
9. User watches video
```

**Result:** ✅ **WORKS AS INTENDED**

---

## 🔐 Encryption Strength

### **AES-256-GCM**

**Key Size:** 256 bits  
**Security Level:** Military-grade  
**Brute Force Time:** Billions of years with current technology  

**Used by:**
- ✅ US Government (Top Secret)
- ✅ Banks (Financial transactions)
- ✅ Signal (Encrypted messaging)
- ✅ WhatsApp (End-to-end encryption)

**Breaking it requires:**
- ❌ Quantum computer (not available yet)
- ❌ Billions of years of computation
- ❌ Or... the encryption key 😉

---

## 📊 What's Visible Where

| Data | Blockchain | IPFS | Access Node | User's Browser |
|------|-----------|------|-------------|----------------|
| **Video CIDs** | ✅ PUBLIC | ✅ PUBLIC | ✅ | ✅ |
| **Encrypted Chunks** | ❌ | ✅ PUBLIC | ❌ | ✅ (if purchased) |
| **Encryption Key** | ❌ | ❌ | 🔒 PRIVATE | ✅ (if purchased) |
| **IVs Array** | ❌ | ❌ | 🔒 PRIVATE | ✅ (if purchased) |
| **Decrypted Video** | ❌ | ❌ | ❌ | ✅ (if purchased) |
| **Creator Address** | ✅ PUBLIC | ❌ | ✅ | ✅ |
| **Video Price** | ✅ PUBLIC | ❌ | ✅ | ✅ |

---

## 🎯 Privacy Guarantees

### **✅ What IS Private**

1. **Video Content**
   - Encrypted with AES-256-GCM
   - Keys stored off-chain
   - Impossible to decrypt without keys

2. **Viewer Identity**
   - AccessCard is a private record (not public mapping)
   - Only owner knows they have access
   - No public list of "who watched what"

3. **Encryption Keys**
   - Never stored on blockchain
   - Only in Access Node (your server)
   - Only given to verified AccessCard owners

### **❌ What is NOT Private**

1. **Video Existence**
   - Anyone can see a video exists
   - CIDs are public on blockchain

2. **Creator Identity**
   - Creator's address is public
   - Anyone can see who created what

3. **Pricing**
   - Video prices are public
   - Anyone can see how much videos cost

4. **Chunk Count**
   - Number of chunks is public
   - Reveals approximate video size

---

## 🛠️ How to Verify Security

### **Test 1: Try to View Encrypted Chunk**

```bash
# Download encrypted chunk
ipfs cat QmYourChunkCID > encrypted_chunk.bin

# Try to view it
cat encrypted_chunk.bin
# Output: Random bytes (garbage)

# Try to play it
vlc encrypted_chunk.bin
# Output: "Cannot open file"
```

**Expected Result:** ✅ Cannot view content

### **Test 2: Check Blockchain Data**

```bash
# Query blockchain for video metadata
aleo query prividocs_v1.aleo videos video_id_123

# You'll see:
{
    creator: "aleo1xxx...",
    price: 10000000,
    chunk_count: 20,
    chunks: [CID1, CID2, ...]
}
```

**Expected Result:** ✅ Metadata visible, but NO encryption keys

### **Test 3: Request Keys Without AccessCard**

```bash
# Try to get keys without NFT
curl -X POST http://localhost:3001/keys/request \
  -H "Content-Type: application/json" \
  -d '{"videoId": "123", "userAddress": "aleo1yyy..."}'

# Response: 403 Forbidden
# "Access denied: No valid AccessCard found"
```

**Expected Result:** ✅ Access denied

---

## 🚨 Potential Privacy Concerns

### **⚠️ Metadata Leakage**

**What's visible:**
- Video exists
- Creator identity
- Price
- Approximate size (chunk count)

**Mitigation:**
- Use pseudonymous addresses
- Don't link real identity to Aleo address
- Consider using privacy-preserving metadata

### **⚠️ IPFS Gateway Tracking**

**What gateways can see:**
- Which CIDs are requested
- When they're requested
- IP addresses of requesters

**Mitigation:**
- Use your own IPFS node
- Use Tor/VPN
- Use multiple gateways
- Consider IPFS over Tor

### **⚠️ Access Node is Centralized**

**Risk:**
- Access Node could be compromised
- Could leak encryption keys
- Single point of failure

**Mitigation:**
- Use secure server (HTTPS, firewall)
- Encrypt keys at rest
- Use hardware security module (HSM)
- Consider decentralized key management (future)

---

## 💡 Comparison with Other Platforms

| Platform | Content Encryption | Key Storage | Access Control |
|----------|-------------------|-------------|----------------|
| **YouTube** | ❌ No | N/A | ❌ Public |
| **Netflix** | ✅ DRM | Centralized | ✅ Subscription |
| **OnlyFans** | ❌ No | N/A | ✅ Paywall |
| **PriviDocs** | ✅ AES-256 | Off-chain (Access Node) | ✅ NFT-based |

**PriviDocs Advantage:**
- ✅ True encryption (not just DRM)
- ✅ Decentralized storage (IPFS)
- ✅ Blockchain-based access control
- ✅ Creator ownership

---

## 🎓 Educational Example

### **What Happens When Someone Tries to Hack**

```python
# Attacker downloads encrypted chunk
encrypted_chunk = ipfs_download("QmXxx...abc")

# Attacker tries to decrypt without key
try:
    decrypted = aes_decrypt(encrypted_chunk, key="wrong_key")
except:
    print("Decryption failed!")

# Attacker tries brute force
for i in range(2**256):  # 256-bit key space
    try:
        decrypted = aes_decrypt(encrypted_chunk, key=i)
        if looks_like_video(decrypted):
            print("Found key!")
            break
    except:
        continue

# Time required: 3.67 × 10^56 years
# (Longer than age of universe × 10^46)
```

**Result:** ❌ **IMPOSSIBLE** to brute force

---

## ✅ Bottom Line

### **CIDs are PUBLIC, but content is SECURE**

```
Public on Blockchain:
├─ Video CIDs ✅
├─ Creator address ✅
├─ Price ✅
└─ Chunk count ✅

Public on IPFS:
└─ Encrypted chunks ✅ (but useless without keys)

Private (Access Node):
├─ Encryption keys 🔒
└─ IVs array 🔒

Private (User's Browser):
└─ Decrypted video 🔒 (only if purchased)
```

**Security Model:**
1. ✅ **Encryption:** AES-256-GCM (military-grade)
2. ✅ **Key Management:** Off-chain (Access Node)
3. ✅ **Access Control:** NFT-based (AccessCard)
4. ✅ **Storage:** Decentralized (IPFS)

**Threat Protection:**
- ✅ Random attackers: Cannot decrypt
- ✅ IPFS snooping: Only see encrypted data
- ✅ Blockchain analysis: Only see metadata
- ✅ Brute force: Computationally impossible

**Your content is SAFE!** 🔒
