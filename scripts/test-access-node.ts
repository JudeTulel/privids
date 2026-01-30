// using native fetch

const ACCESS_NODE_URL = 'http://localhost:3001';

async function runTest() {
    console.log("Testing Access Node...");

    const cid = "QmTestCID_" + Date.now();
    const key = "test-encrypted-key";
    const iv = "test-iv";
    const owner = "aleo1parser...";
    const signature = "mock-signature";

    // 1. Store Key
    console.log("1. Storing Key...");
    const storeRes = await fetch(`${ACCESS_NODE_URL}/keys/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cid, encryptedKey: key, iv, ownerAddress: owner, signature
        })
    });

    if (storeRes.ok) {
        console.log("Store Success");
    } else {
        console.error("Store Failed", await storeRes.text());
        return;
    }

    // 2. Request Key (As Owner)
    console.log("2. Requesting Key (As Owner)...");
    const reqRes = await fetch(`${ACCESS_NODE_URL}/keys/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cid, requesterAddress: owner, signature
        })
    });

    if (reqRes.ok) {
        const data = await reqRes.json();
        console.log("Request Success", data);
        if (data.encryptedKey === key && data.iv === iv) {
            console.log("VERIFIED: Key matches.");
        } else {
            console.error("MISMATCH: Key does not match.");
        }
    } else {
        console.error("Request Failed", await reqRes.text());
    }

    // 3. Request Key (As Buyer - Mocked)
    console.log("3. Requesting Key (As Buyer)...");
    const buyer = "aleo1buyer...";
    const reqRes2 = await fetch(`${ACCESS_NODE_URL}/keys/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cid, requesterAddress: buyer, signature
        })
    });

    if (reqRes2.ok) {
        console.log("Buyer Access Granted (Expected for MVP)");
    } else {
        console.error("Buyer Access Denied");
    }
}

runTest().catch(console.error);
