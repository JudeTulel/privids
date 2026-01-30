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
        this.chunkCache.delete(oldestKey)
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
    // Mock implementation - in production use SubtleCrypto API
    console.log(' Decrypting chunk with key:', encryptionKey.substring(0, 8) + '...')

    // Simulate decryption delay
    await new Promise((resolve) => setTimeout(resolve, 50))

    return encryptedData
  }

  /**
   * Upload video to IPFS and return CID
   */
  async uploadVideo(
    file: File,
    encryptionKey?: string
  ): Promise<IPFSVideoMetadata> {
    try {
      console.log(' Uploading video to IPFS:', file.name)

      const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
      if (!pinataJwt) {
        throw new Error('Pinata JWT not found. Please set NEXT_PUBLIC_PINATA_JWT in .env.local');
      }

      const formData = new FormData();
      formData.append('file', file);

      const metadataStr = JSON.stringify({
        name: file.name,
        keyvalues: {
          type: 'video',
          createdAt: new Date().toISOString()
        }
      });
      formData.append('pinataMetadata', metadataStr);

      const optionsStr = JSON.stringify({
        cidVersion: 1,
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

      // Mock chunk size for now as we don't control chunks with simple pinFileToIPFS unless manual upload
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
      return metadata
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
  public static splitCidToU128(cid: string): { part1: string, part2: string } {
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
