import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, '../keys.json');

app.use(cors());
app.use(bodyParser.json());

// Simple file-based DB
interface KeyRecord {
    cid: string;
    encryptedKey: string;
    iv: string; // Base64 encoded IV
    ownerAddress: string;
}

// Load DB
let keyStore: Record<string, KeyRecord> = {};
if (fs.existsSync(DB_FILE)) {
    try {
        keyStore = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
        console.error("Failed to load keys.json", e);
    }
}

function saveDb() {
    fs.writeFileSync(DB_FILE, JSON.stringify(keyStore, null, 2));
}

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

app.get('/', (req, res) => {
    res.send('PriviDocs Access Node Running');
});

/**
 * STORE KEY
 * Called by Creator after uploading to IPFS.
 */
app.post('/keys/store', (req, res) => {
    try {
        const { cid, encryptedKey, iv, ownerAddress, signature } = req.body;

        if (!cid || !encryptedKey || !iv || !ownerAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // TODO: Verify signature matches ownerAddress
        // const isValid = verifySignature(ownerAddress, signature, `Store Key for ${cid}`);

        keyStore[cid] = {
            cid,
            encryptedKey,
            iv,
            ownerAddress
        };
        saveDb();

        console.log(`[STORE] Key stored for CID: ${cid} by ${ownerAddress}`);
        return res.json({ success: true });
    } catch (error) {
        console.error('Store error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * REQUEST KEY
 * Called by Viewer (or Creator) to play video.
 */
app.post('/keys/request', (req, res) => {
    try {
        const { cid, requesterAddress, signature } = req.body;

        if (!cid || !requesterAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const record = keyStore[cid];
        if (!record) {
            return res.status(404).json({ error: 'Key not found' });
        }

        // 1. Verify Signature (Proof of Identity)
        // const isValid = verifySignature(requesterAddress, signature, `Request Key for ${cid}`);

        // 2. Access Control Logic
        // If Requester == Owner -> Allow
        if (requesterAddress === record.ownerAddress) {
            console.log(`[ACCESS] Granting access to owner: ${requesterAddress}`);
            return res.json({
                encryptedKey: record.encryptedKey,
                iv: record.iv
            });
        }

        // TODO: If Requester != Owner -> Verify AccessCard on Aleo Chain
        // This requires detailed ZK proof validation or tracking.
        // FOR NOW: We Log and Allow (Open Access Mode with Encryption)
        // Or we could implement a simple whitelist if we had one.

        console.log(`[ACCESS] Granting access to viewer: ${requesterAddress}`);
        return res.json({
            encryptedKey: record.encryptedKey,
            iv: record.iv
        });

    } catch (error) {
        console.error('Request error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Access Node listening on port ${PORT}`);
});
