program prividocs_v1.aleo {

    // -----------------------------------------
    // 1. Data Structures
    // -----------------------------------------

    // Represents a Video listed on the platform
    // Stored in public mapping so anyone can browse
    struct VideoMetadata {
        creator: address,
        price: u64,
        ipfs_cid_part1: u128, // IPFS CIDs are long, we split them or hash them
        ipfs_cid_part2: u128
    }

    // The "Ticket". If a user owns this record, they can watch the video.
    // This is PRIVATE. No one knows which videos you own.
    record AccessCard {
        owner: address,
        video_id: field,
        gates: u64, // Defines what this card unlocks (e.g. 1 = simple access)
    }

    // -----------------------------------------
    // 2. Storage (State)
    // -----------------------------------------

    // Map: Video ID (field) -> VideoMetadata
    mapping videos: field => VideoMetadata;

    // -----------------------------------------
    // 3. Transactions
    // -----------------------------------------

    // CREATOR: Publish a new video to the chain
    transition publish_video(
        public video_id: field,
        public price: u64,
        public cid1: u128,
        public cid2: u128
    ) {
        // Create the metadata struct
        let meta: VideoMetadata = VideoMetadata {
            creator: self.caller,
            price: price,
            ipfs_cid_part1: cid1,
            ipfs_cid_part2: cid2
        };

        // Finalize: Save to public storage
        return then finalize(video_id, meta);
    }

    finalize publish_video(id: field, meta: VideoMetadata) {
        // Ensure ID doesn't already exist
        let exists: bool = Mapping::contains(videos, id);
        assert.eq(exists, false);

        // Save video
        Mapping::set(videos, id, meta);
    }

    // VIEWER: Buy access to a video
    // This function handles the payment AND mints the AccessCard
    transition buy_access(
        public video_id: field,
        // The user inputs their Credits record to pay
        private payment_record: credits.aleo/credits, 
        private amount_to_spend: u64
    ) -> (AccessCard, credits.aleo/credits, credits.aleo/credits) {
        
        // 1. Prepare Minting the Access Card (The product)
        let card: AccessCard = AccessCard {
            owner: self.caller,
            video_id: video_id,
            gates: 1u64
        };

        // 2. Handle Payment (Simplified Transfer Logic)
        // In a real generic transfer, we would debit the sender (payment_record) 
        // and credit the video creator.
        // For this POC, we are just returning the payment records to satisfy signature 
        // constraints, but assuming the "transfer" happens via standard credits.aleo calls
        // or a specific transfer logic implemented here.
        // NOTE: A full "transfer" implementation in Leo requires handling change.
        
        // We leave the payment logic as input/output pass-through for now, 
        // effectively simulating the payment flow structure.
        
        return (card, payment_record, payment_record) then finalize(video_id, self.caller, amount_to_spend);
    }

    finalize buy_access(video_id: field, buyer: address, amount: u64) {
        // 1. Get Video Metadata
        let meta: VideoMetadata = Mapping::get(videos, video_id);

        // 2. Verify Payment Amount (In a real transfer, we'd check if clean transfer happened)
        // Here we just assert that the *intent* was to pay enough.
        assert.ge(amount, meta.price);
    }
}
