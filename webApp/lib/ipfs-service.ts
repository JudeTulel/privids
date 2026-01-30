export interface IPFSVideoMetadata {
  cid: string
  fileName: string
  fileSize: number
  mimeType: string
  chunkSize: number
  totalChunks: number
  createdAt: number
}

export interface ChunkData {
  chunkIndex: number
  data: ArrayBuffer
  encrypted: boolean
}

export interface StreamingConfig {
  chunkSize: number // bytes per chunk
  bufferSize: number // number of chunks to buffer
  timeout: number // ms before timeout
}

class IPFSService {
  private ipfsGateway: string
  private accessNodeUrl: string = 'http://localhost:3001'
  private chunkCache: Map<string, ChunkData> = new Map()
  private streamingConfig: StreamingConfig = {
    chunkSize: 256 * 1024, // 256KB chunks
    bufferSize: 5, // Buffer 5 chunks ahead
    timeout: 30000, // 30s timeout
  }

  constructor() {
    this.ipfsGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'
  }

  /**
   * Get IPFS gateway URL for a CID
   */
  getGatewayUrl(cid: string): string {
    return `${this.ipfsGateway}/ipfs/${cid}`
  }

  // --- CRYPTO HELPERS ---

  private async generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  private async exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return this.ab2str(exported);
  }

  private async importKey(keyStr: string): Promise<CryptoKey> {
    const keyData = this.str2ab(keyStr);
    return window.crypto.subtle.importKey(
      "raw",
      keyData,
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );
  }

  private async encryptFile(file: File, key: CryptoKey): Promise<{ encryptedBlob: Blob, iv: string }> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const fileData = await file.arrayBuffer();

    const encryptedFn = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      fileData
    );

    return {
      encryptedBlob: new Blob([encryptedFn]),
      iv: this.ab2str(iv.buffer)
    };
  }

  // Utils for ArrayBuffer <-> Base64
  private ab2str(buf: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  }

  private str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  /**
   * Request Key from Access Node
   */
  async requestAccessKey(cid: string, userAddress: string, signature: string): Promise<string | null> {
    try {
      const res = await fetch(`${this.accessNodeUrl}/keys/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cid, requesterAddress: userAddress, signature })
      });

      if (!res.ok) throw new Error('Access denied');
      const data = await res.json();
      return `${data.iv}:${data.encryptedKey}`; // Return packed format
    } catch (e) {
      console.error("Key request failed", e);
      return null;
    }
  }

  /**
   * Store Key in Access Node (Helper)
   */
  async storeAccessKey(cid: string, key: string, iv: string, ownerAddress: string, signature: string) {
    await fetch(`${this.accessNodeUrl}/keys/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cid, encryptedKey: key, iv, ownerAddress, signature })
    });
  }

  /**
   * Get streaming URL for a specific chunk
   */
  getChunkUrl(videoCid: string, chunkIndex: number): string {
    return `${this.ipfsGateway}/ipfs/${videoCid}`
    // Note: To support chunked streaming from a single large file on IPFS, 
    // we would need range requests or HLS. For now, we point to the whole file.
  }

  /**
   * Retrieve and decrypt a video chunk from IPFS
   */
  async fetchChunk(
    videoCid: string,
    chunkIndex: number,
    encryptionKey?: string
  ): Promise<ChunkData> {
    const cacheKey = `${videoCid}-${chunkIndex}`

    // Check cache first
    if (this.chunkCache.has(cacheKey)) {
      console.log(' Chunk loaded from cache:', cacheKey)
      return this.chunkCache.get(cacheKey)!
    }

    try {
      // In a real implementation with range requests, we would fetch a specific byte range.
      // For simplicity in this demo, we are just fetching the whole file or relying on browser range requests if available.
      // But fetchChunk implies manual chunk management. 
      // Let's implement a basic fetch for now, assuming small videos or browser handling.

      const chunkUrl = this.getChunkUrl(videoCid, chunkIndex)
      console.log(' Fetching chunk from IPFS:', chunkUrl)

      // TODO: Implement Range header for partial content if needed
      const response = await fetch(chunkUrl, {
        signal: AbortSignal.timeout(this.streamingConfig.timeout),
      })

      if (!response.ok) {
        throw new Error(`IPFS fetch failed: ${response.status}`)
      }

      let data = await response.arrayBuffer()

      // Decrypt chunk if encryption key provided
      if (encryptionKey) {
        data = await this.decryptChunk(data, encryptionKey)
        console.log(' Chunk decrypted')
      }

      const chunkData: ChunkData = {
        chunkIndex,
        data,
        encrypted: !!encryptionKey,
      }

      // Cache the chunk
      this.chunkCache.set(cacheKey, chunkData)

      // Limit cache size
      if (this.chunkCache.size > 20) {
        const oldestKey = this.chunkCache.keys().next().value
        if (oldestKey !== undefined) {
          this.chunkCache.delete(oldestKey)
        }
      }

      return chunkData
    } catch (error) {
      console.error(' Error fetching chunk:', error)
      throw error
    }
  }

  /**
   * Stream video from IPFS with adaptive bitrate
   * Yields chunks as they become available
   */
  async *streamVideo(
    videoCid: string,
    totalChunks: number,
    encryptionKey?: string
  ): AsyncGenerator<ChunkData> {
    let chunkIndex = 0
    const bufferSize = this.streamingConfig.bufferSize

    while (chunkIndex < totalChunks) {
      // Pre-fetch buffered chunks
      const fetchPromises: Promise<ChunkData>[] = []

      for (
        let i = chunkIndex;
        i < Math.min(chunkIndex + bufferSize, totalChunks);
        i++
      ) {
        fetchPromises.push(this.fetchChunk(videoCid, i, encryptionKey))
      }

      try {
        const chunks = await Promise.all(fetchPromises)

        // Yield chunks in order
        for (const chunk of chunks) {
          yield chunk
          chunkIndex++
        }
      } catch (error) {
        console.error(' Streaming error:', error)
        throw error
      }
    }
  }

  /**
   * Mock decryption using AES-256-GCM
   * In production, use actual crypto library
   */
  private async decryptChunk(
    encryptedData: ArrayBuffer,
    encryptionKey: string
  ): Promise<ArrayBuffer> {
    // Decrypt using Web Crypto API
    try {
      if (!encryptionKey) return encryptedData;

      // Import Key
      const key = await this.importKey(encryptionKey);

      // We need the IV. 
      // Option A: IV was prepended to the data.
      // Option B: IV is passed separately.
      // Since fetchChunk doesn't take IV, we assume we need to fetch it or it's prepended.
      // Let's assume we fetch the key AND IV from the access node before calling this?
      // Or we assume IV is prepended to the *file*.
      // If we are fetching *chunks* of an encrypted file, we can't easily prepend IV to the whole file and expect chunks to align unless we use CTR mode.
      // GCM is authenticating, so we must decrypt the *entire block*.
      // For this MVP, we are downloading the WHOLE file in chunks but really mostly assuming one blob for small files 
      // OR we handle the IV being at the start of chunk 0.

      // SIMPLIFICATION: We assume IV is passed as part of the "encryptionKey" string (delimeter) 
      // OR we fetch it from Access Node and store it in cache.
      // Let's try to parse IV from the key string if we packed it? 
      // Format: "IV_BASE64:KEY_BASE64"

      const parts = encryptionKey.split(':');
      if (parts.length !== 2) {
        console.warn("Invalid key format, expected IV:KEY");
        return encryptedData;
      }

      const iv = this.str2ab(atob(parts[0]));
      const rawKey = this.str2ab(atob(parts[1]));

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        rawKey,
        "AES-GCM",
        true,
        ["decrypt"]
      );

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        cryptoKey,
        encryptedData
      );

      return decrypted;
    } catch (e) {
      console.error("Decryption failed:", e);
      throw e;
    }
  }

  /**
   * Upload video to IPFS and return CID
   */
  async uploadVideo(
    file: File,
    encryptionKey?: string
  ): Promise<IPFSVideoMetadata> {
    try {
      // 1. Generate Encryption Key
      const key = await this.generateKey();

      // 2. Encrypt File
      const { encryptedBlob, iv } = await this.encryptFile(file, key);
      const exportedKey = await this.exportKey(key);

      // 3. Upload Encrypted File to IPFS
      console.log(' Uploading encrypted video to IPFS:', file.name)

      const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
      if (!pinataJwt) {
        throw new Error('Pinata JWT not found. Please set NEXT_PUBLIC_PINATA_JWT in .env.local');
      }

      const formData = new FormData();
      formData.append('file', encryptedBlob, file.name); // Upload encrypted blob

      const metadataStr = JSON.stringify({
        name: file.name,
        keyvalues: {
          type: 'video',
          createdAt: new Date().toISOString(),
          encrypted: 'true'
        }
      });
      formData.append('pinataMetadata', metadataStr);

      const optionsStr = JSON.stringify({
        cidVersion: 1, // CIDv1
      });
      formData.append('pinataOptions', optionsStr);

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Pinata upload failed: ${res.status} ${errorText}`);
      }

      const resData = await res.json();
      const ipfsHash = resData.IpfsHash;

      // 4. Store Key in Access Node
      // Note: Caller is responsible for actual storage call with signature

      const chunkSize = this.streamingConfig.chunkSize
      const totalChunks = Math.ceil(file.size / chunkSize)

      const metadata: IPFSVideoMetadata = {
        cid: ipfsHash,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        chunkSize,
        totalChunks,
        createdAt: Date.now(),
      }

      console.log(' Video uploaded successfully to Pinata, CID:', ipfsHash)

      return {
        ...metadata,
        // @ts-ignore
        encryption: {
          key: exportedKey,
          iv: iv
        }
      }
    } catch (error) {
      console.error(' Upload error:', error)
      throw error
    }
  }

  /**
   * Get video metadata from IPFS
   */
  async getVideoMetadata(cid: string): Promise<IPFSVideoMetadata> {
    try {
      console.log(' Fetching video metadata from IPFS:', cid)

      // Mock fetch - in production, retrieve from smart contract or index
      const metadata: IPFSVideoMetadata = {
        cid,
        fileName: 'video.mp4',
        fileSize: 104857600, // 100MB
        mimeType: 'video/mp4',
        chunkSize: this.streamingConfig.chunkSize,
        totalChunks: 400,
        createdAt: Date.now() - 86400000, // 1 day ago
      }

      return metadata
    } catch (error) {
      console.error(' Metadata fetch error:', error)
      throw error
    }
  }

  /**
   * Pin a video CID to ensure persistence
   */
  async pinVideo(cid: string): Promise<boolean> {
    try {
      console.log(' Pinning video to IPFS:', cid)

      // If we uploaded via Pinata, it's already pinned.
      // This might be for re-pinning or other services.
      return true
    } catch (error) {
      console.error(' Pin error:', error)
      return false
    }
  }

  /**
   * clearCache
   */
  clearCache(): void {
    this.chunkCache.clear()
    console.log('Chunk cache cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedChunks: this.chunkCache.size,
      maxCacheSize: 20,
      cacheUtilization: (this.chunkCache.size / 20) * 100,
    }
  }

  /**
   * Utility to split a CID string into two u128 compatible strings for Aleo
   * This is a simplified approach. In production, use a more robust encoding scheme.
   * Aleo u128 is roughly 3.4e38.
   * A CID is usually base58 or base32. We can decode to bytes and split, or just split the string characters if they fit.
   * For this demo, let's just split the string into two halves and hex encode them to numbers.
   * NOTE: This is a placeholder logic. Real implementation needs robust string->field encoding.
   */
  public splitCidToU128(cid: string): { part1: string, part2: string } {
    // Very basic Mock implementation for the demo
    // In a real app one might convert the CID to bytes, then to BigInts.
    // Here just returning dummy values or simple numeric hash of the string

    return {
      part1: "123456789u128",
      part2: "987654321u128"
    };
  }
}

// Export singleton instance
export const ipfsService = new IPFSService()
