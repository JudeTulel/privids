import credits.aleo;

program prividocs_v1.aleo {

    // -----------------------------------------
    // 0. Constants
    // -----------------------------------------

    // Platform fee: 2%
    const PLATFORM_FEE_PERCENT: u64 = 2u64;
    const FEE_DENOMINATOR: u64 = 100u64;

    // Maximum number of chunks per video
    const MAX_CHUNKS: u8 = 32u8;

    // Platform treasury address
    const PLATFORM_ADDRESS: address =
        aleo1te9n6c7m9xkqmq2f8zc2xjj69t69jt64vmmnm0s0hyrupsauugqsdpqe74;

    // -----------------------------------------
    // 1. Data Structures
    // -----------------------------------------

    struct ChunkCID {
        part1: u128,
        part2: u128
    }

    struct VideoMetadata {
        creator: address,
        price: u64,
        chunk_count: u8,
        chunks: [ChunkCID; 32]
    }

    record AccessCard {
        owner: address,
        video_id: field,
        gates: u64
    }

    // -----------------------------------------
    // 2. Storage
    // -----------------------------------------

    mapping videos: field => VideoMetadata;
    mapping total_fees_collected: u8 => u64;

    // -----------------------------------------
    // 3. Constructor
    // -----------------------------------------

    async transition initialize_contract() -> Future {
        return finalize_initialize_contract();
    }

    async function finalize_initialize_contract() {
        Mapping::set(total_fees_collected, 0u8, 0u64);
    }

    // -----------------------------------------
    // 4. Publish Video
    // -----------------------------------------

    async transition publish_video(
        public video_id: field,
        public price: u64,
        public chunk_count: u8,
        public chunks: [ChunkCID; 32]
    ) -> Future {
        return finalize_publish_video(
            self.caller,
            video_id,
            price,
            chunk_count,
            chunks
        );
    }

    async function finalize_publish_video(
        creator: address,
        video_id: field,
        price: u64,
        chunk_count: u8,
        chunks: [ChunkCID; 32]
    ) {
        let exists: bool = Mapping::contains(videos, video_id);
        assert_eq(exists, false);

        assert(chunk_count >= 1u8);
        assert(chunk_count <= MAX_CHUNKS);

        let meta: VideoMetadata = VideoMetadata {
            creator: creator,
            price: price,
            chunk_count: chunk_count,
            chunks: chunks
        };

        Mapping::set(videos, video_id, meta);
    }

    // -----------------------------------------
    // 5. Buy Access
    // -----------------------------------------

    async transition buy_access(
        public buyer: address,
        public video_id: field,
        public creator: address,
        public amount: u64,
        pay_record: credits.aleo/credits
    ) -> (
        AccessCard,
        credits.aleo/credits,
        credits.aleo/credits,
        credits.aleo/credits,
        Future
    ) {

        // Ensure buyer is the transaction caller
        assert_eq(buyer, self.caller);

        let platform_fee: u64 =
            (amount * PLATFORM_FEE_PERCENT) / FEE_DENOMINATOR;

        let creator_amount: u64 = amount - platform_fee;

        let (platform_payment, remaining):
            (credits.aleo/credits, credits.aleo/credits) =
            credits.aleo/transfer_private(
                pay_record,
                PLATFORM_ADDRESS,
                platform_fee
            );

        let (creator_payment, buyer_change):
            (credits.aleo/credits, credits.aleo/credits) =
            credits.aleo/transfer_private(
                remaining,
                creator,
                creator_amount
            );

        let ticket: AccessCard = AccessCard {
            owner: buyer,
            video_id: video_id,
            gates: 1u64
        };

        return (
            ticket,
            platform_payment,
            creator_payment,
            buyer_change,
            finalize_buy_access(
                video_id,
                creator,
                amount,
                platform_fee
            )
        );
    }

    async function finalize_buy_access(
        video_id: field,
        paid_creator: address,
        paid_amount: u64,
        fee_amount: u64
    ) {
        let meta: VideoMetadata = Mapping::get(videos, video_id);

        assert_eq(meta.creator, paid_creator);
        assert(paid_amount >= meta.price);

        let current_fees: u64 =
            Mapping::get_or_use(total_fees_collected, 0u8, 0u64);

        let new_total: u64 = current_fees + fee_amount;

        Mapping::set(total_fees_collected, 0u8, new_total);
    }
}
