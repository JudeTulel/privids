/**
 * STREAMING-COMPATIBLE ENCRYPTION SERVICE
 * 
 * This service encrypts videos in chunks to enable streaming while maintaining security.
 * Each chunk is encrypted independently with AES-GCM, allowing random access and progressive decryption.
 */

export interface EncryptedChunk {
    chunkIndex: number;
    encryptedData: ArrayBuffer;
    iv: string; // Base64 encoded IV for this chunk
}

export interface EncryptionMetadata {
    key: string; // Base64 encoded AES key
    chunkIVs: string[]; // Array of IVs, one per chunk
    totalChunks: number;
}

export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

class StreamingEncryptionService {
    /**
     * Generate a new AES-256-GCM encryption key
     */
    async generateKey(): Promise<CryptoKey> {
        return window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Export key to base64 string
     */
    async exportKey(key: CryptoKey): Promise<string> {
        const exported = await window.crypto.subtle.exportKey("raw", key);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    }

    /**
     * Import key from base64 string
     */
    async importKey(keyStr: string): Promise<CryptoKey> {
        const keyData = Uint8Array.from(atob(keyStr), c => c.charCodeAt(0));
        return window.crypto.subtle.importKey(
            "raw",
            keyData,
            "AES-GCM",
            true,
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Split file into chunks
     */
    splitFileIntoChunks(file: File): Blob[] {
        const chunks: Blob[] = [];
        let offset = 0;

        while (offset < file.size) {
            const chunk = file.slice(offset, offset + CHUNK_SIZE);
            chunks.push(chunk);
            offset += CHUNK_SIZE;
        }

        return chunks;
    }

    /**
     * Encrypt a single chunk with its own IV
     */
    async encryptChunk(
        chunkData: ArrayBuffer,
        key: CryptoKey,
        chunkIndex: number
    ): Promise<EncryptedChunk> {
        // Generate unique IV for this chunk
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encryptedData = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            chunkData
        );

        return {
            chunkIndex,
            encryptedData,
            iv: btoa(String.fromCharCode(...iv))
        };
    }

    /**
     * Encrypt entire file in chunks
     * Returns array of encrypted chunks and encryption metadata
     */
    async encryptFileInChunks(
        file: File
    ): Promise<{ encryptedChunks: EncryptedChunk[], metadata: EncryptionMetadata }> {
        // Generate encryption key
        const key = await this.generateKey();
        const exportedKey = await this.exportKey(key);

        // Split file into chunks
        const chunks = this.splitFileIntoChunks(file);
        console.log(`📦 Split file into ${chunks.length} chunks`);

        // Encrypt each chunk
        const encryptedChunks: EncryptedChunk[] = [];
        const chunkIVs: string[] = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunkData = await chunks[i].arrayBuffer();
            const encrypted = await this.encryptChunk(chunkData, key, i);

            encryptedChunks.push(encrypted);
            chunkIVs.push(encrypted.iv);

            console.log(`🔒 Encrypted chunk ${i + 1}/${chunks.length}`);
        }

        const metadata: EncryptionMetadata = {
            key: exportedKey,
            chunkIVs,
            totalChunks: chunks.length
        };

        return { encryptedChunks, metadata };
    }

    /**
     * Decrypt a single chunk
     * This can be called independently for any chunk, enabling streaming!
     */
    async decryptChunk(
        encryptedData: ArrayBuffer,
        keyStr: string,
        ivStr: string
    ): Promise<ArrayBuffer> {
        try {
            // Import key
            const key = await this.importKey(keyStr);

            // Decode IV
            const iv = Uint8Array.from(atob(ivStr), c => c.charCodeAt(0));

            // Decrypt
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                encryptedData
            );

            return decrypted;
        } catch (error) {
            console.error("❌ Chunk decryption failed:", error);
            throw error;
        }
    }

    /**
     * Stream and decrypt chunks progressively
     * This is the key to streaming encrypted videos!
     */
    async *streamDecryptedChunks(
        chunkCids: string[],
        encryptionKey: string,
        chunkIVs: string[],
        ipfsGateway: string = 'https://gateway.pinata.cloud'
    ): AsyncGenerator<Blob> {
        for (let i = 0; i < chunkCids.length; i++) {
            console.log(`📥 Fetching chunk ${i + 1}/${chunkCids.length}`);

            // Fetch encrypted chunk from IPFS
            const response = await fetch(`${ipfsGateway}/ipfs/${chunkCids[i]}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch chunk ${i}: ${response.status}`);
            }

            const encryptedData = await response.arrayBuffer();

            // Decrypt chunk
            console.log(`🔓 Decrypting chunk ${i + 1}/${chunkCids.length}`);
            const decryptedData = await this.decryptChunk(
                encryptedData,
                encryptionKey,
                chunkIVs[i]
            );

            // Yield decrypted chunk as Blob
            yield new Blob([decryptedData]);
        }
    }

    /**
     * Create a streamable video URL from encrypted chunks
     * Uses MediaSource API for progressive playback
     */
    async createStreamableVideoUrl(
        chunkCids: string[],
        encryptionKey: string,
        chunkIVs: string[],
        mimeType: string = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
    ): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                // Check MediaSource support
                if (!window.MediaSource) {
                    throw new Error("MediaSource API not supported");
                }

                const mediaSource = new MediaSource();
                const videoUrl = URL.createObjectURL(mediaSource);

                mediaSource.addEventListener('sourceopen', async () => {
                    try {
                        const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                        const chunks: ArrayBuffer[] = [];

                        // Stream and decrypt all chunks
                        for await (const decryptedChunk of this.streamDecryptedChunks(
                            chunkCids,
                            encryptionKey,
                            chunkIVs
                        )) {
                            const arrayBuffer = await decryptedChunk.arrayBuffer();
                            chunks.push(arrayBuffer);
                        }

                        // Append all chunks to source buffer
                        for (const chunk of chunks) {
                            await new Promise<void>((resolveAppend) => {
                                sourceBuffer.addEventListener('updateend', () => resolveAppend(), { once: true });
                                sourceBuffer.appendBuffer(chunk);
                            });
                        }

                        mediaSource.endOfStream();
                    } catch (error) {
                        reject(error);
                    }
                });

                resolve(videoUrl);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Simple approach: Decrypt all chunks and create blob URL
     * Good for smaller videos (<100MB)
     */
    async createBlobVideoUrl(
        chunkCids: string[],
        encryptionKey: string,
        chunkIVs: string[]
    ): Promise<string> {
        const decryptedChunks: Blob[] = [];

        // Decrypt all chunks
        for await (const chunk of this.streamDecryptedChunks(
            chunkCids,
            encryptionKey,
            chunkIVs
        )) {
            decryptedChunks.push(chunk);
        }

        // Combine into single blob
        const videoBlob = new Blob(decryptedChunks, { type: 'video/mp4' });
        return URL.createObjectURL(videoBlob);
    }
}

// Export singleton
export const streamingEncryption = new StreamingEncryptionService();

/**
 * USAGE EXAMPLE:
 * 
 * // 1. UPLOAD (Creator Side)
 * const { encryptedChunks, metadata } = await streamingEncryption.encryptFileInChunks(videoFile);
 * 
 * // Upload each encrypted chunk to IPFS
 * const chunkCids = [];
 * for (const chunk of encryptedChunks) {
 *   const blob = new Blob([chunk.encryptedData]);
 *   const cid = await uploadToIPFS(blob);
 *   chunkCids.push(cid);
 * }
 * 
 * // Store metadata.key and metadata.chunkIVs in Access Node
 * // Store chunkCids on blockchain
 * 
 * // 2. PLAYBACK (Viewer Side)
 * const videoUrl = await streamingEncryption.createBlobVideoUrl(
 *   chunkCids,
 *   encryptionKey,  // Retrieved from Access Node
 *   chunkIVs        // Retrieved from Access Node
 * );
 * 
 * videoElement.src = videoUrl;
 * videoElement.play();
 */
