# Program ID & Payment Token Guide

## 🆔 Program ID (Contract Address)

### **What is a Program ID?**

In Aleo, the **Program ID** is equivalent to a contract address in Ethereum. It's the unique identifier for your deployed smart contract.

**Your Program ID:** `prividocs_v1.aleo`

This is defined in `contracts/prividocs/program.json`:
```json
{
  "program": "prividocs_v1.aleo",
  "version": "0.0.0",
  "description": "PriviDocs Video Protocol"
}
```

---

## 📍 Where Program ID is Used

### **1. Smart Contract Declaration**
```leo
// contracts/prividocs/src/main.leo
program prividocs_v1.aleo {
    // Your contract code
}
```

### **2. Frontend Transaction Calls**
```typescript
// webApp/services/contract.ts
export const PRIVIDOCS_PROGRAM_ID = "prividocs_v1.aleo";

const transaction = Transaction.createTransaction(
    publicKey,
    WalletAdapterNetwork.Testnet,
    PRIVIDOCS_PROGRAM_ID,  // ← Your program ID
    "publish_video",
    [...args],
    fee
);
```

### **3. Import in Other Contracts**
```leo
import prividocs_v1.aleo;

program my_other_program.aleo {
    // Can call prividocs_v1.aleo functions
}
```

---

## 💰 Payment Tokens: USAD vs Credits

### **Current Implementation: `credits.aleo`**

Your smart contract currently uses **Aleo Credits** for payments:

```leo
import credits.aleo;

transition buy_access(
    public video_id: field,
    public creator: address, 
    public amount: u64,
    pay_record: credits.aleo/credits.record  // ← Using credits
) -> (...) {
    // Transfer credits to platform
    credits.aleo/transfer_private(pay_record, PLATFORM_ADDRESS, platform_fee);
    
    // Transfer credits to creator
    credits.aleo/transfer_private(remaining, creator, creator_amount);
}
```

---

## 🎯 USAD Token Integration

### **What is USAD?**

**USAD** is a **stablecoin** on Aleo (similar to USDC/USDT on Ethereum):
- 💵 Pegged to 1 USD
- 🔒 Privacy-preserving
- 🌍 Global payments
- 📊 Stable pricing (no volatility)

### **Why Use USAD Instead of Credits?**

| Feature | Aleo Credits | USAD Stablecoin |
|---------|--------------|-----------------|
| **Price Stability** | ❌ Volatile | ✅ Stable ($1) |
| **User Experience** | ❌ "10,000 credits" confusing | ✅ "$10" clear |
| **Business Model** | ❌ Unpredictable revenue | ✅ Predictable revenue |
| **Global Payments** | ⚠️ Exchange rate varies | ✅ Always $1 |

---

## 🔧 How to Integrate USAD

### **Option 1: Wait for Official USAD Token**

USAD is mentioned in your README but may not be deployed yet. Check:
- Aleo documentation
- Aleo Discord/Community
- Official Aleo token registry

### **Option 2: Use Credits for Testnet (Current)**

For **testnet development**, continue using `credits.aleo`:

```leo
import credits.aleo;

// Use credits for testing
transition buy_access(
    pay_record: credits.aleo/credits.record
) -> (...) {
    credits.aleo/transfer_private(pay_record, creator, amount);
}
```

**Pros:**
- ✅ Works immediately
- ✅ Free testnet credits
- ✅ No external dependencies

**Cons:**
- ❌ Volatile pricing
- ❌ Not production-ready for payments

### **Option 3: Create Your Own Stablecoin Wrapper**

If USAD isn't available, create a wrapper:

```leo
// usad_wrapper.aleo
program usad_wrapper.aleo {
    // Wrap credits with 1:1 USD peg
    // Oracle integration for price feeds
    // Minting/burning logic
}
```

### **Option 4: Use USAD When Available (Recommended)**

When USAD is deployed, update your contract:

```leo
import usad.aleo;  // ← Change from credits.aleo

program prividocs_v1.aleo {
    transition buy_access(
        public video_id: field,
        public creator: address, 
        public amount: u64,
        pay_record: usad.aleo/usad.record  // ← Use USAD token
    ) -> (...) {
        // Transfer USAD to platform
        usad.aleo/transfer_private(pay_record, PLATFORM_ADDRESS, platform_fee);
        
        // Transfer USAD to creator
        usad.aleo/transfer_private(remaining, creator, creator_amount);
    }
}
```

---

## 📝 Environment Configuration

### **Update `.env.local`**

Add these variables:

```bash
# Program ID
NEXT_PUBLIC_PROGRAM_ID=prividocs_v1.aleo

# Network
NEXT_PUBLIC_NETWORK=testnet  # or mainnet

# Payment Token
NEXT_PUBLIC_PAYMENT_TOKEN=credits.aleo  # Change to usad.aleo when available

# IPFS
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud

# Access Node
NEXT_PUBLIC_ACCESS_NODE_URL=http://localhost:3001

# Platform Address (receives 2% fee)
NEXT_PUBLIC_PLATFORM_ADDRESS=aleo1your_platform_address_here
```

### **Update Contract Service**

```typescript
// webApp/services/contract.ts

// Read from environment
export const PRIVIDOCS_PROGRAM_ID = 
    process.env.NEXT_PUBLIC_PROGRAM_ID || "prividocs_v1.aleo";

export const PAYMENT_TOKEN = 
    process.env.NEXT_PUBLIC_PAYMENT_TOKEN || "credits.aleo";

export const NETWORK = 
    process.env.NEXT_PUBLIC_NETWORK === "mainnet" 
        ? WalletAdapterNetwork.Mainnet 
        : WalletAdapterNetwork.Testnet;

// Use in transactions
const transaction = Transaction.createTransaction(
    publicKey,
    NETWORK,
    PRIVIDOCS_PROGRAM_ID,
    "buy_access",
    [...args],
    fee
);
```

---

## 🚀 Deployment Workflow

### **Step 1: Deploy to Testnet (Using Credits)**

```bash
# Build contract
cd contracts/prividocs
leo build

# Deploy to testnet
snarkos developer deploy \
    --private-key YOUR_PRIVATE_KEY \
    --query https://api.explorer.aleo.org/v1 \
    --path ./build \
    --broadcast https://api.explorer.aleo.org/v1/testnet/transaction/broadcast \
    --fee 1000000 \
    --record RECORD_STRING

# Note the deployed program ID
# Should be: prividocs_v1.aleo
```

### **Step 2: Update Frontend**

```typescript
// .env.local
NEXT_PUBLIC_PROGRAM_ID=prividocs_v1.aleo
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_PAYMENT_TOKEN=credits.aleo
```

### **Step 3: Test with Testnet Credits**

1. Get testnet credits from faucet
2. Upload a test video
3. Buy access with credits
4. Verify 2% platform fee works

### **Step 4: Migrate to USAD (When Available)**

1. Update contract to import `usad.aleo`
2. Change all `credits.aleo/credits.record` to `usad.aleo/usad.record`
3. Rebuild and redeploy
4. Update frontend environment variables
5. Test with USAD tokens

---

## 💡 Pricing Strategy

### **With Credits (Testnet)**

```typescript
// Prices in credits (volatile)
const VIDEO_PRICES = {
    short: 1000000,      // 1 credit
    medium: 5000000,     // 5 credits
    long: 10000000,      // 10 credits
};
```

### **With USAD (Production)**

```typescript
// Prices in USAD (stable, $1 = 1 USAD)
const VIDEO_PRICES = {
    short: 1000000,      // $1 USAD
    medium: 5000000,     // $5 USAD
    long: 10000000,      // $10 USAD
};

// Display to users
function formatPrice(usadAmount: number): string {
    return `$${(usadAmount / 1000000).toFixed(2)} USAD`;
}

// Example: 5000000 → "$5.00 USAD"
```

---

## 🔄 Migration Path

### **Phase 1: Testnet with Credits** ✅ (Current)
```
Use credits.aleo for testing
Free testnet credits
Validate all features work
```

### **Phase 2: Testnet with USAD** (When available)
```
Deploy USAD testnet version
Update contract imports
Test with USAD tokens
Verify pricing is stable
```

### **Phase 3: Mainnet with USAD** (Production)
```
Deploy to mainnet
Use real USAD tokens
Real payments to creators
2% platform fee in USAD
```

---

## 📊 Fee Calculation Examples

### **With Credits (Current)**

```
Video Price: 10,000,000 credits
Platform Fee (2%): 200,000 credits
Creator Receives: 9,800,000 credits

⚠️ Problem: If 1 credit = $0.50 today, but $2.00 tomorrow
Creator revenue is unpredictable!
```

### **With USAD (Recommended)**

```
Video Price: 10,000,000 USAD ($10.00)
Platform Fee (2%): 200,000 USAD ($0.20)
Creator Receives: 9,800,000 USAD ($9.80)

✅ Benefit: Always $10, regardless of market conditions
Creator revenue is predictable!
```

---

## 🛠️ Code Updates Needed

### **1. Update Smart Contract**

```leo
// When USAD is available, change:
import credits.aleo;  // ❌ Remove

// To:
import usad.aleo;     // ✅ Add

// Update all references:
credits.aleo/credits.record → usad.aleo/usad.record
credits.aleo/transfer_private → usad.aleo/transfer_private
```

### **2. Update Frontend**

```typescript
// services/contract.ts
export const PAYMENT_TOKEN_PROGRAM = "usad.aleo";  // Change from credits.aleo

// Update transaction building
const transaction = Transaction.createTransaction(
    publicKey,
    NETWORK,
    PRIVIDOCS_PROGRAM_ID,
    "buy_access",
    [
        videoId,
        creatorAddress,
        `${priceInUSAD}u64`,
        usadRecord  // ← USAD record instead of credits record
    ],
    fee
);
```

### **3. Update UI**

```tsx
// Display prices in USD
<p className="text-2xl font-bold">
    ${(priceInUSAD / 1_000_000).toFixed(2)} USAD
</p>

// Instead of:
<p className="text-2xl font-bold">
    {priceInCredits} credits
</p>
```

---

## 📋 Checklist

### **For Testnet (Now)**
- [x] Use `credits.aleo` for payments
- [x] Program ID: `prividocs_v1.aleo`
- [ ] Add `NEXT_PUBLIC_PROGRAM_ID` to `.env.local`
- [ ] Add `NEXT_PUBLIC_NETWORK=testnet` to `.env.local`
- [ ] Deploy contract to testnet
- [ ] Test with testnet credits

### **For Production (Later)**
- [ ] Wait for USAD token deployment
- [ ] Update contract to use `usad.aleo`
- [ ] Rebuild and redeploy
- [ ] Update frontend to use USAD
- [ ] Test on testnet with USAD
- [ ] Deploy to mainnet

---

## 🎯 Recommended Approach

**For now (Development/Testing):**
1. ✅ Use `credits.aleo` 
2. ✅ Keep program ID as `prividocs_v1.aleo`
3. ✅ Test all features on testnet
4. ✅ Get free testnet credits from faucet

**For production (When USAD is ready):**
1. 🔄 Switch to `usad.aleo`
2. 🔄 Update program to `prividocs_v2.aleo` (new version)
3. 🔄 Deploy to mainnet
4. 🔄 Enable real payments

---

## 🔗 Resources

- **Aleo Documentation**: https://developer.aleo.org
- **Aleo Explorer**: https://explorer.aleo.org
- **Testnet Faucet**: https://faucet.aleo.org
- **Leo Language Guide**: https://developer.aleo.org/leo

---

## ❓ FAQ

**Q: Can I use my own token instead of USAD?**  
A: Yes! Create your own token contract or use any Aleo token. Just import it and use its transfer functions.

**Q: How do I get testnet credits?**  
A: Visit https://faucet.aleo.org and enter your testnet address.

**Q: What if USAD never launches?**  
A: You can use credits.aleo on mainnet, or create your own stablecoin wrapper.

**Q: Can I change the program ID after deployment?**  
A: No. Once deployed, the program ID is permanent. Deploy a new version (e.g., `prividocs_v2.aleo`) if needed.

**Q: How do I test payments locally?**  
A: Use Aleo testnet with testnet credits. Local development doesn't support full payment testing.
