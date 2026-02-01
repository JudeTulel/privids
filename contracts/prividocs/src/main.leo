import credits.aleo;

program prividocs_v1.aleo {

    // -----------------------------------------
    // 0. Constants
    // -----------------------------------------
    
    // Platform fee: 2% (represented as 2 out of 100)
    const PLATFORM_FEE_PERCENT: u64 = 2u64;
    const FEE_DENOMINATOR: u64 = 100u64;
    
    // Maximum number of chunks per video (32 chunks * 5MB = 160MB max)
    const MAX_CHUNKS: u8 = 32u8;
    
    // Platform address that receives fees
    // TODO: Replace with actual platform address
    const PLATFORM_ADDRESS: address = aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc;

    // -----------------------------------------
    // 1. Data Structures
    // -----------------------------------------

    // Struct to store a single chunk's CID (split into two u128 parts)
    struct ChunkCID {
        part1: u128,
        part2: u128
    }

    struct VideoMetadata {
        creator: address,
        price: u64,
        chunk_count: u8,  // Number of chunks (1-32)
        chunks: [ChunkCID; 32]  // Array of chunk CIDs (max 32)
    }

    record AccessCard {
        owner: address,
        video_id: field,
        gates: u64
    }

    // -----------------------------------------
    // 2. Storage (State)
    // -----------------------------------------

    mapping videos: field => VideoMetadata;
    mapping total_fees_collected: u8 => u64; // Track total platform fees

    // -----------------------------------------
    // 3. Transactions
    // -----------------------------------------

    /**
     * PUBLISH VIDEO (with chunked upload support)
     * @param video_id - Unique identifier for the video
     * @param price - Price in credits to access the video
     * @param chunk_count - Number of chunks (1-32)
     * @param chunks - Array of chunk CIDs (max 32)
     */
    async transition publish_video(
        public video_id: field,
        public price: u64,
        public chunk_count: u8,
        public chunks: [ChunkCID; 32]
    ) -> Future {
        return finalize_publish_video(self.caller, video_id, price, chunk_count, chunks);
    }

    async function finalize_publish_video(
        creator: address, 
        video_id: field, 
        price: u64,
        chunk_count: u8,
        chunks: [ChunkCID; 32]
    ) {
        // 1. Ensure this Video ID hasn't been used yet
        let exists: bool = Mapping::contains(videos, video_id);
        assert_eq(exists, false);

        // 2. Validate chunk count (must be between 1 and 32)
        assert(chunk_count >= 1u8);
        assert(chunk_count <= MAX_CHUNKS);

        // 3. Create and store metadata
        let meta: VideoMetadata = VideoMetadata {
            creator: creator,
            price: price,
            chunk_count: chunk_count,
            chunks: chunks
        };
        Mapping::set(videos, video_id, meta);
    }

    /**
     * BUY ACCESS (with platform fee)
     */
    async transition buy_access(
        public video_id: field,
        public creator: address, 
        public amount: u64,
        pay_record: credits.aleo/credits
    ) -> (AccessCard, credits.aleo/credits, credits.aleo/credits, credits.aleo/credits, Future) {
        
        // 1. Calculate platform fee (2% of amount)
        let platform_fee: u64 = (amount * PLATFORM_FEE_PERCENT) / FEE_DENOMINATOR;
        let creator_amount: u64 = amount - platform_fee;

        // 2. Transfer fee to platform
        let (platform_payment, remaining): (credits.aleo/credits, credits.aleo/credits) = 
            credits.aleo/transfer_private(pay_record, PLATFORM_ADDRESS, platform_fee);

        // 3. Transfer remaining amount to creator
        let (creator_payment, buyer_change): (credits.aleo/credits, credits.aleo/credits) = 
            credits.aleo/transfer_private(remaining, creator, creator_amount);

        // 4. Mint the Access Card
        let ticket: AccessCard = AccessCard {
            owner: self.caller,
            video_id: video_id,
            gates: 1u64
        };

        // Output: (Ticket, Platform Fee Payment, Creator Payment, Buyer Change, FinalizeFuture)
        return (ticket, platform_payment, creator_payment, buyer_change, finalize_buy_access(video_id, creator, amount, platform_fee));
    }

    async function finalize_buy_access(video_id: field, paid_address: address, paid_amount: u64, fee_amount: u64) {
        // 1. Fetch the official video metadata
        let meta: VideoMetadata = Mapping::get(videos, video_id);

        // 2. VERIFY: Did the user pay the correct person?
        assert_eq(meta.creator, paid_address);

        // 3. VERIFY: Did the user pay the full price?
        assert(paid_amount >= meta.price);

        // 4. Track total fees collected
        let current_fees: u64 = Mapping::get_or_use(total_fees_collected, 0u8, 0u64);
        let new_total: u64 = current_fees + fee_amount;
        Mapping::set(total_fees_collected, 0u8, new_total);
    }
}