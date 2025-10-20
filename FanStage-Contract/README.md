# Fan Stage - Artist Crowdfunding Platform

A decentralized crowdfunding platform built on Solidity that enables artists to raise funds from fans with a tier-based profit-sharing system. Deployed on **Base Sepolia** testnet.

## 🎯 Overview

Fanetic Stage allows artists to create crowdfunding campaigns where fans can contribute and receive:
- **Artist Tokens (ERC-20)** - Minted 1:1 with IDRX contributions
- **Tier Badges (ERC-1155)** - NFT badges for reaching funding thresholds (Bronze, Silver, Gold, Platinum)
- **Profit Share** - Weighted returns based on tier level when the artist generates revenue

Artists get verified through a soul-bound NFT identity system, ensuring authenticity and preventing duplicate registrations.

## 🏗️ Architecture

### Core Contracts

1. **ArtistIdentity.sol** - Soul-Bound NFT Identity System
   - ERC-721 based non-transferable NFTs
   - One identity per artist (prevents duplicates)
   - Unique artist name registry
   - Metadata URI for artist profiles

2. **CampaignContract.sol** - Individual Campaign Logic
   - ERC-1155 for tier badges + campaign NFT
   - ERC-20 Artist Tokens (created per campaign)
   - Tier-based profit distribution
   - Flexible refund system (before completion)
   - Campaign lifecycle management (ONGOING → FUNDED → COMPLETED)

3. **CampaignRegistry.sol** - Campaign Factory
   - Creates and tracks all campaigns
   - Requires artist registration
   - Charges creation fee in IDRX
   - Optimized to < 24kb for mainnet deployment

4. **MockIDRX.sol** - Test Payment Token
   - ERC-20 stablecoin mock (2 decimals)
   - Represents Indonesian Rupiah for testing
   - Replace with real IDRX on mainnet

## ✨ Key Features

### 🎭 Artist Identity (Soul-Bound NFT)
- One-time registration with unique name
- Non-transferable identity NFT
- Profile metadata on IPFS
- Admin revocation capability

### 💰 Tier-Based Profit Sharing
Artists configure 1-4 tiers with:
- Custom funding thresholds
- Profit weight percentages (1%-100%)
- Unique benefits per tier

**Example:**
```
Revenue: 100,000 IDRX | Funder Share: 30%

Alice: 10,000 IDRX @ Gold (3%) → 22,500 IDRX (225% ROI!)
Bob:   10,000 IDRX @ Bronze (1%) → 7,500 IDRX (75% ROI)

Same funding, but Gold tier gets 3x more profit!
```

### 🔄 Flexible Refund System
- Refund anytime before campaign completion
- Burns Artist Tokens + tier badges
- Returns IDRX 1:1
- Campaign status reverts if total drops below target

### 📊 Campaign Lifecycle
```
ONGOING → Accepting contributions
   ↓ (target reached)
FUNDED → Waiting for artist revenue
   ↓ (revenue submitted)
COMPLETED → Funders claim profits
   ↓ (deadline passed + no target)
FAILED → Funders get refunds
```

## 🚀 Deployment

### Prerequisites

1. **Get Base Sepolia ETH**
   - Visit [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
   - Or [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia)

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Add your PRIVATE_KEY and optionally BASESCAN_API_KEY
   ```

### Deploy to Base Sepolia

```bash
npm run deploy
```

Or directly:
```bash
npx hardhat run scripts/deploy.ts --network base-sepolia
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npx hardhat test test/ArtistIdentity.test.ts
npx hardhat test test/CampaignContract.test.ts
npx hardhat test test/CampaignRegistry.test.ts
```

### Test Coverage
- ✅ **ArtistIdentity**: Registration, Soul-bound transfers, Profile updates, Revocation
- ✅ **CampaignContract**: Funding, Tier badges, Refunds, Profit distribution
- ✅ **CampaignRegistry**: Factory pattern, Fee charging, Access control

See [TEST_DOCUMENTATION.md](TEST_DOCUMENTATION.md) for comprehensive test details.

## 📡 Network Details

| Property | Value |
|----------|-------|
| **Network** | Base Sepolia |
| **Chain ID** | 84532 |
| **RPC URL** | https://sepolia.base.org |
| **Explorer** | https://sepolia.basescan.org |
| **Faucet** | https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet |

## 📦 Tech Stack

- **Solidity** ^0.8.26
- **Hardhat** 2.22.0
- **OpenZeppelin Contracts** 5.4.0
- **TypeScript** for tests and deployment
- **Ethers.js** v6
- **Base (OP Stack)** - L2 optimistic rollup

## 📖 Contract Interactions

### Register as Artist
```javascript
const artistIdentity = await ethers.getContractAt("ArtistIdentity", ADDRESS);
await artistIdentity.registerArtist("Artist Name", "ipfs://metadata");
```

### Create Campaign
```javascript
const campaignRegistry = await ethers.getContractAt("CampaignRegistry", ADDRESS);
const tiers = [
  { name: "Bronze", threshold: 10000, profitPercent: 1, benefits: "ipfs://bronze" },
  { name: "Silver", threshold: 100000, profitPercent: 2, benefits: "ipfs://silver" },
  { name: "Gold", threshold: 1000000, profitPercent: 3, benefits: "ipfs://gold" }
];

await idrx.approve(campaignRegistry.address, creationFee);
const campaignAddress = await campaignRegistry.createCampaign(
  "ipfs://campaign-data",
  targetAmount,
  duration,
  30, // 30% funder share
  tiers,
  "ARTIST-TOKEN",
  "Campaign NFT Name"
);
```

### Fund Campaign
```javascript
const campaign = await ethers.getContractAt("CampaignContract", campaignAddress);
await idrx.approve(campaignAddress, fundingAmount);
await campaign.fund(fundingAmount);
```

### Claim Revenue (After Campaign Completes)
```javascript
await campaign.claimRevenue();
```

## 🔐 Security Features

- ✅ **ReentrancyGuard** on all fund transfers
- ✅ **Soul-bound identities** (non-transferable)
- ✅ **Access control** with modifiers
- ✅ **Input validation** with custom errors/requires
- ✅ **Immutable critical addresses** (IDRX, ArtistIdentity)
- ✅ **Weighted distribution** prevents gaming the system

## 📊 Contract Sizes

| Contract | Size | Status |
|----------|------|--------|
| **CampaignRegistry** | < 24kb | ✅ Deployable |
| **CampaignContract** | ~22kb | ✅ Deployable |
| **ArtistIdentity** | ~18kb | ✅ Deployable |
| **ArtistToken** | ~8kb | ✅ Deployable |

## 🛠️ Development Commands

```bash
# Compile contracts
npm run compile

# Clean artifacts
npm run clean

# Run tests
npm test

# Deploy to Base Sepolia
npm run deploy

# Verify contract
npx hardhat verify --network base-sepolia <ADDRESS> [CONSTRUCTOR_ARGS]

# Open Hardhat console
npx hardhat console --network base-sepolia
```

## 📝 Project Structure

```
fan-contract/
├── contracts/
│   ├── ArtistIdentity.sol       # Soul-bound artist NFT
│   ├── ArtistToken.sol           # ERC-20 campaign tokens
│   ├── CampaignContract.sol      # Main campaign logic
│   ├── CampaignRegistry.sol      # Campaign factory
│   ├── MockIDRX.sol              # Test payment token
│   └── interfaces/
│       └── ICampaignContract.sol
├── test/
│   ├── ArtistIdentity.test.ts
│   ├── CampaignContract.test.ts
│   └── CampaignRegistry.test.ts
├── scripts/
│   └── deploy.ts                 # Deployment script
├── ignition/
│   └── parameters/
│       └── base-sepolia.json     # Deployment parameters
├── DEPLOYMENT.md                 # Deployment guide
├── TEST_DOCUMENTATION.md         # Test suite details
└── NETWORK_MIGRATION.md          # Lisk → Base migration notes
```

## 🎯 Use Cases

1. **Music Albums** - Fans fund album production, earn % of streaming revenue
2. **Art Projects** - Support artists, share in artwork sales profits
3. **Events/Tours** - Fund concert tours, profit from ticket sales
4. **Content Creation** - Back creators, earn from content monetization
5. **Merchandise** - Fund merch production, share in sales

## 🚨 Important Notes

- ⚠️ **Testnet Only** - These contracts are deployed on Base Sepolia testnet
- ⚠️ **MockIDRX** - Replace with real IDRX token for mainnet
- ⚠️ **Audit Required** - Get professional audit before mainnet deployment
- ⚠️ **Gas Optimization** - Further optimization possible for lower deployment costs

## 📜 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For issues, questions, or feature requests, please open an issue on GitHub.

## 🔗 Resources

- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [Base Sepolia Explorer](https://sepolia.basescan.org)
- [Base Documentation](https://docs.base.org)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)

---

**Built with ❤️ for artists and fans**
