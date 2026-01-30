import credits.aleo;

program prividocs_v1.aleo {

    // -----------------------------------------
    // 1. Data Structures
    // -----------------------------------------

    struct VideoMetadata {
        creator: address,
        price: u64,
        cid_part1: u128, 
        cid_part2: u128
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

    // -----------------------------------------
    // 3. Transactions
    // -----------------------------------------

    /**
     * PUBLISH VIDEO
     */
    transition publish_video(
        public video_id: field,
        public price: u64,
        public cid_part1: u128,
        public cid_part2: u128
    ) -> Future {
        return finalize_publish_video(self.caller, video_id, price, cid_part1, cid_part2);
    }

    async function finalize_publish_video(
        creator: address, 
        video_id: field, 
        price: u64, 
        c1: u128, 
        c2: u128
    ) {
        // 1. Ensure this Video ID hasn't been used yet
        let exists: bool = Mapping::contains(videos, video_id);
        assert_eq(exists, false);

        // 2. Create and store metadata
        let meta: VideoMetadata = VideoMetadata {
            creator: creator,
            price: price,
            cid_part1: c1,
            cid_part2: c2
        };
        Mapping::set(videos, video_id, meta);
    }

    /**
     * BUY ACCESS
     */
    transition buy_access(
        public video_id: field,
        public creator: address, 
        public amount: u64,
        pay_record: credits.aleo/credits.record
    ) -> (AccessCard, credits.aleo/credits.record, credits.aleo/credits.record, Future) {
        
        // 1. Handle Payment via credits.aleo
        let (creator_payment, buyer_change): (credits.aleo/credits.record, credits.aleo/credits.record) = 
            credits.aleo/transfer_private(pay_record, creator, amount);

        // 2. Mint the Access Card
        let ticket: AccessCard = AccessCard {
            owner: self.caller,
            video_id: video_id,
            gates: 1u64
        };

        // Output: (The Ticket, Payment for Creator, Change for Buyer, FinalizeFuture)
        return (ticket, creator_payment, buyer_change, finalize_buy_access(video_id, creator, amount));
    }

    async function finalize_buy_access(video_id: field, paid_address: address, paid_amount: u64) {
        // 1. Fetch the official video metadata
        let meta: VideoMetadata = Mapping::get(videos, video_id);

        // 2. VERIFY: Did the user pay the correct person?
        assert_eq(meta.creator, paid_address);

        // 3. VERIFY: Did the user pay the full price?
        assert(paid_amount >= meta.price);
    }
}