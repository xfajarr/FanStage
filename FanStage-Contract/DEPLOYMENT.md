# Deployment Guide - Base Sepolia Testnet

## Prerequisites

1. **Get Base Sepolia ETH**
   - Visit [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
   - Or use [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia)
   - Request testnet ETH for gas fees

2. **Prepare Wallet**
   - Export your wallet's private key from MetaMask or another wallet
   - **IMPORTANT:** Never share your private key or commit it to git!

## Setup

1. **Create .env file**
   ```bash
   cp .env.example .env
   ```

2. **Configure .env**
   Edit `.env` file with your values:
   ```bash
   # Your wallet private key (without 0x prefix)
   PRIVATE_KEY=your_private_key_here
   ```

3. **Configure deployment parameters (Optional)**
   Edit `ignition/parameters/base-sepolia.json`:
   ```json
   {
     "DeployModule": {
       "platformWallet": "0xYourPlatformWalletAddress",
       "campaignCreationFee": "1000000"
     }
   }
   ```

   If not configured, it will use the deployer address as platform wallet and 10000 (100.00 IDRX) as creation fee.

## Deployment

### Deploy All Contracts
```bash
npm run deploy
```

Or directly:
```bash
npx hardhat run scripts/deploy.ts --network base-sepolia
```

This will deploy:
- ✅ MockIDRX (IDRX Token - 2 decimals, 1M initial supply)
- ✅ ArtistIdentity (Soul-bound NFT)
- ✅ CampaignRegistry (Factory contract)

### Verify Contracts

After deployment, the script will output verification commands. Copy and run them:

```bash
# Verify MockIDRX
npx hardhat verify --network base-sepolia <MOCK_IDRX_ADDRESS>

# Verify ArtistIdentity
npx hardhat verify --network base-sepolia <ARTIST_IDENTITY_ADDRESS>

# Verify CampaignRegistry
npx hardhat verify --network base-sepolia <CAMPAIGN_REGISTRY_ADDRESS> <ARTIST_IDENTITY_ADDRESS> <MOCK_IDRX_ADDRESS> <PLATFORM_WALLET> <CREATION_FEE>
```

## Deployment Info

After deployment, contract addresses are saved to:
```
deployments/base-sepolia-<timestamp>.json
```

This file contains:
- All deployed contract addresses
- Constructor parameters
- Verification commands
- Block explorer links

## Network Details

- **Network Name:** Base Sepolia
- **Chain ID:** 84532
- **RPC URL:** https://sepolia.base.org
- **Block Explorer:** https://sepolia.basescan.org
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

## Troubleshooting

### "insufficient funds for gas"
- Get more testnet ETH from the faucet
- Check your balance on the block explorer

### "nonce too low"
- Clear pending transactions in MetaMask
- Or wait for previous transactions to confirm

### "transaction underpriced"
- Increase gas price in hardhat.config.ts:
  ```typescript
  "base-sepolia": {
    gasPrice: 1000000000, // 1 gwei (Base has low gas fees)
  }
  ```

## Post-Deployment

1. **Get Deployed Addresses**
   ```bash
   cat deployments/base-sepolia-*.json
   ```

2. **Interact with Contracts**
   ```bash
   # Open Hardhat console
   npx hardhat console --network base-sepolia

   # In console:
   const MockIDRX = await ethers.getContractAt("MockIDRX", "<MOCK_IDRX_ADDRESS>");
   const ArtistIdentity = await ethers.getContractAt("ArtistIdentity", "<ARTIST_IDENTITY_ADDRESS>");
   const CampaignRegistry = await ethers.getContractAt("CampaignRegistry", "<CAMPAIGN_REGISTRY_ADDRESS>");

   # Check IDRX balance
   await MockIDRX.balanceOf("<YOUR_ADDRESS>");

   # Register as artist
   await ArtistIdentity.registerArtist("Your Name", "ipfs://your-metadata");
   ```

3. **Save Addresses**
   - Update your frontend with deployed contract addresses
   - Add network to MetaMask if not already added

## Security Notes

- ⚠️ Never commit `.env` file to git
- ⚠️ Never share your private key
- ⚠️ These are TESTNET contracts - not for mainnet use
- ⚠️ MockIDRX is for testing only - use real IDRX on mainnet
- ✅ CampaignRegistry is now optimized and under 24kb limit - ready for mainnet!

## Next Steps

After deployment, you can:
1. Interact with contracts via Hardhat console
2. Build your frontend integration
3. Test the full campaign lifecycle
4. Monitor transactions on [Base Sepolia Explorer](https://sepolia.basescan.org)
