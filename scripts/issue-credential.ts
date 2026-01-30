import { Account, Signature } from '@aleohq/sdk';

// 1. Setup Issuer (Government / Identity Provider)
// In production, load this from secure env
const issuerAccount = new Account();
const issuerAddress = issuerAccount.address().to_string();

console.log("Issuer Address:", issuerAddress);
console.log("Issuer Private Key (SAVE THIS):", issuerAccount.privateKey().to_string());

// 2. Define User Data
const birthDate = new Date("2000-01-01T00:00:00Z");
const birthTimestamp = BigInt(Math.floor(birthDate.getTime() / 1000));

console.log(`Issuing credential for DOB: ${birthDate.toISOString()} (${birthTimestamp})`);

// 3. Sign the attributes
// Aleo signatures sign a message (fields)
// We sign the birth_timestamp as a Field element or u64
// Note: Depending on SDK version, we might need to convert to field string
const message = birthTimestamp.toString(); // Simple u64 string representation
const signature = issuerAccount.sign(new TextEncoder().encode(message));

// 4. Output the Credential Object
const credential = {
    birthTimestamp: Number(birthTimestamp), // JS number for frontend
    signature: signature.to_string(),
    issuer: issuerAddress
};

console.log("\n=== ISSUED CREDENTIAL ===");
console.log(JSON.stringify(credential, null, 2));
console.log("=========================");
