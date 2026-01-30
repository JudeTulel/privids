import credits.aleo;
program prividocs_v1.aleo;

record AccessCard:
    owner as address.private;
    video_id as field.private;
    gates as u64.private;

struct VideoMetadata:
    creator as address;
    price as u64;
    cid_part1 as u128;
    cid_part2 as u128;

mapping videos:
    key as field.public;
    value as VideoMetadata.public;

function publish_video:
    input r0 as field.public;
    input r1 as u64.public;
    input r2 as u128.public;
    input r3 as u128.public;
    async publish_video self.caller r0 r1 r2 r3 into r4;
    output r4 as prividocs_v1.aleo/publish_video.future;

finalize publish_video:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u64.public;
    input r3 as u128.public;
    input r4 as u128.public;
    contains videos[r1] into r5;
    assert.eq r5 false;
    cast r0 r2 r3 r4 into r6 as VideoMetadata;
    set r6 into videos[r1];

function buy_access:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u64.public;
    input r3 as credits.aleo/credits.record;
    call credits.aleo/transfer_private r3 r1 r2 into r4 r5;
    cast self.caller r0 1u64 into r6 as AccessCard.record;
    async buy_access r0 r1 r2 into r7;
    output r6 as AccessCard.record;
    output r4 as credits.aleo/credits.record;
    output r5 as credits.aleo/credits.record;
    output r7 as prividocs_v1.aleo/buy_access.future;

finalize buy_access:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u64.public;
    get videos[r0] into r3;
    assert.eq r3.creator r1;
    gte r2 r3.price into r4;
    assert.eq r4 true;
