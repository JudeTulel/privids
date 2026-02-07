import credits.aleo;
program prividocs_v1.aleo;

record AccessCard:
    owner as address.private;
    video_id as field.private;
    gates as u64.private;

struct ChunkCID:
    part1 as u128;
    part2 as u128;

struct VideoMetadata:
    creator as address;
    price as u64;
    chunk_count as u8;
    chunks as [ChunkCID; 32u32];

mapping videos:
    key as field.public;
    value as VideoMetadata.public;

mapping total_fees_collected:
    key as u8.public;
    value as u64.public;

function initialize_contract:
    async initialize_contract into r0;
    output r0 as prividocs_v1.aleo/initialize_contract.future;

finalize initialize_contract:
    set 0u64 into total_fees_collected[0u8];

function publish_video:
    input r0 as field.public;
    input r1 as u64.public;
    input r2 as u8.public;
    input r3 as [ChunkCID; 32u32].public;
    async publish_video self.caller r0 r1 r2 r3 into r4;
    output r4 as prividocs_v1.aleo/publish_video.future;

finalize publish_video:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u64.public;
    input r3 as u8.public;
    input r4 as [ChunkCID; 32u32].public;
    contains videos[r1] into r5;
    assert.eq r5 false;
    gte r3 1u8 into r6;
    assert.eq r6 true;
    lte r3 32u8 into r7;
    assert.eq r7 true;
    cast r0 r2 r3 r4 into r8 as VideoMetadata;
    set r8 into videos[r1];

function buy_access:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as address.public;
    input r3 as u64.public;
    input r4 as credits.aleo/credits.record;
    assert.eq r0 self.caller;
    mul r3 2u64 into r5;
    div r5 100u64 into r6;
    sub r3 r6 into r7;
    call credits.aleo/transfer_private r4 aleo1te9n6c7m9xkqmq2f8zc2xjj69t69jt64vmmnm0s0hyrupsauugqsdpqe74 r6 into r8 r9;
    call credits.aleo/transfer_private r9 r2 r7 into r10 r11;
    cast r0 r1 1u64 into r12 as AccessCard.record;
    async buy_access r1 r2 r3 r6 into r13;
    output r12 as AccessCard.record;
    output r8 as credits.aleo/credits.record;
    output r10 as credits.aleo/credits.record;
    output r11 as credits.aleo/credits.record;
    output r13 as prividocs_v1.aleo/buy_access.future;

finalize buy_access:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u64.public;
    input r3 as u64.public;
    get videos[r0] into r4;
    assert.eq r4.creator r1;
    gte r2 r4.price into r5;
    assert.eq r5 true;
    get.or_use total_fees_collected[0u8] 0u64 into r6;
    add r6 r3 into r7;
    set r7 into total_fees_collected[0u8];
