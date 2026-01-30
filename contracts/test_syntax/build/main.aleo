program test_syntax.aleo;

function main:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    async main r2 into r3;
    output r3 as test_syntax.aleo/main.future;

finalize main:
    input r0 as u32.public;
    assert.eq r0 5u32;

constructor:
    assert.eq edition 0u16;
