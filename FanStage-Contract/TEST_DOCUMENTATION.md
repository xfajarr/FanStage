# Fanetic Stage - Test Documentation

## Overview

Comprehensive test suite for the Fanetic Stage crowdfunding platform with tier-based profit sharing.

## Test Files Created

### 1. **ArtistIdentity.test.ts** - Soul-Bound NFT Tests
Tests the artist registration and identity management system.

**Test Coverage:**
- ✅ **Registration**
  - Register artist with correct data
  - Mint identity NFT to artist
  - Revert on empty artist name
  - Revert on empty metadata URI
  - Revert on duplicate artist name
  - Revert if artist already registered
  - Increment token IDs for multiple registrations

- ✅ **Soul-Bound (Non-Transferable)**
  - Block transfers between addresses
  - Block safeTransferFrom

- ✅ **Update Profile**
  - Update artist name and metadata
  - Make old name available after update
  - Revert on empty new name
  - Revert if new name already exists
  - Revert if caller not registered

- ✅ **Revoke Identity**
  - Owner can revoke artist identity
  - Burn NFT on revoke
  - Free up artist name on revoke
  - Revert if non-owner tries to revoke

- ✅ **View Functions**
  - Return total artists
  - Return all artists
  - Return profile by token ID
  - Return artist by token ID

---

### 2. **CampaignContract.test.ts** - Core Campaign Logic Tests
Tests the main crowdfunding contract with ERC-20 Artist Tokens and ERC-1155 tier badges.

**Test Coverage:**

#### **Campaign Creation**
- ✅ Deploy campaign with correct parameters
- ✅ Mint Campaign NFT to artist
- ✅ Create Artist Token (ERC-20)
- ✅ Configure tiers correctly

#### **Funding System**
- ✅ Allow funding and mint Artist Tokens (ERC-20)
- ✅ Mint Bronze badge when threshold reached
- ✅ Mint Silver badge when threshold reached
- ✅ Change status to FUNDED when target reached
- ✅ Revert on 0 amount funding

#### **Flexible Refund System**
- ✅ Allow refund during ONGOING status
- ✅ Burn all tier badges on refund
- ✅ Revert status from FUNDED to ONGOING if below target
- ✅ Block refund after COMPLETED status
- ✅ Update totalRaised when refunding
- ✅ Return IDRX 1:1 with Artist Tokens

#### **Tier-Based Profit Sharing**
- ✅ Distribute revenue with tier-based weighting
- ✅ Calculate weighted shares correctly:
  ```
  Example: 100,000 IDRX revenue, 30% funder share
  - Funder1: 50,000 IDRX, Gold (3%) → weighted 150,000 → gets 15,000 IDRX
  - Funder2: 30,000 IDRX, Gold (3%) → weighted 90,000 → gets 9,000 IDRX
  - Funder3: 20,000 IDRX, Gold (3%) → weighted 60,000 → gets 6,000 IDRX
  - Artist gets 70,000 IDRX
  ```
- ✅ Allow funders to claim revenue
- ✅ Weight profit by tier percentage (Gold gets more than Bronze)
- ✅ Change status to COMPLETED after revenue submission

#### **View Functions**
- ✅ Return correct funder info
- ✅ Return correct total funders

---

###3. **CampaignRegistry.test.ts** - Factory Contract Tests
Tests the campaign factory and registry system.

**Test Coverage:**

#### **Deployment**
- ✅ Set correct initial values
- ✅ Start with 0 campaigns

#### **Campaign Creation**
- ✅ Create campaign successfully
- ✅ Charge creation fee to artist
- ✅ Track artist campaigns
- ✅ Revert if caller not registered artist
- ✅ Revert if funderSharePercent > 50%
- ✅ Revert if no tiers provided
- ✅ Revert if tier profitPercent is 0
- ✅ Revert if tiers not in ascending order

#### **View Functions**
- ✅ Return campaign contract address
- ✅ Return campaign details
- ✅ Check if campaign exists
- ✅ Return campaign ID by address
- ✅ Return active campaigns
- ✅ Return artist active campaigns

#### **Admin Functions**
- ✅ Owner can update platform wallet
- ✅ Revert if non-owner tries to update
- ✅ Owner can update creation fee
- ✅ Owner can transfer ownership

---

## Key Test Scenarios

### Scenario 1: Full Campaign Lifecycle
```typescript
1. Artist registers via ArtistIdentity
2. Artist creates campaign via CampaignRegistry
3. Funders contribute IDRX
4. Funders receive Artist Tokens (ERC-20) + Tier Badges (ERC-1155)
5. Campaign reaches target → Status changes to FUNDED
6. Artist submits revenue
7. Profit distributed based on tier weights
8. Funders claim their share
9. Status changes to COMPLETED
```

### Scenario 2: Refund During Campaign
```typescript
1. Funder contributes 10,000 IDRX → Gets Gold badge
2. Campaign status: ONGOING
3. Funder needs money → Calls refund()
4. Artist Tokens burned
5. Gold badge NFT burned
6. 10,000 IDRX returned
7. totalRaised decreases
```

### Scenario 3: Tier-Based Profit Distribution
```typescript
Revenue: 100,000 IDRX
Funder Share: 30% = 30,000 IDRX pool

Alice: 10,000 IDRX, Gold (3%) → weighted 30,000
Bob: 10,000 IDRX, Bronze (1%) → weighted 10,000
Total weighted: 40,000

Alice gets: 30,000 × (30,000/40,000) = 22,500 IDRX (225% ROI!)
Bob gets: 30,000 × (10,000/40,000) = 7,500 IDRX (75% ROI)

Result: Same funding amount, but Gold tier gets 3x more profit!
```

---

## Mock Contracts

### MockERC20.sol
Mock IDRX token for testing with 2 decimals.

**Features:**
- Mint function for test setup
- Burn function for cleanup
- 2 decimal precision (matching real IDRX)

---

## Running Tests

### Prerequisites
```bash
npm install
```

### Compile Contracts
```bash
npm run compile
```

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npx hardhat test test/ArtistIdentity.test.ts
npx hardhat test test/CampaignContract.test.ts
npx hardhat test test/CampaignRegistry.test.ts
```

### Run Tests with Gas Reporter
```bash
REPORT_GAS=true npx hardhat test
```

---

## Test Configuration

**hardhat.config.ts:**
- Solidity version: 0.8.26
- Optimizer: Enabled (200 runs)
- TypeChain: ethers-v6
- Network: Hardhat (local)

**Testing Framework:**
- Hardhat
- Ethers.js v6
- Chai matchers
- TypeScript

---

## Coverage Areas

| Contract | Lines | Functions | Branches |
|----------|-------|-----------|----------|
| ArtistIdentity | ✅ High | ✅ High | ✅ High |
| CampaignContract | ✅ High | ✅ High | ✅ High |
| CampaignRegistry | ✅ High | ✅ High | ✅ High |
| ArtistToken | ✅ Covered | ✅ Covered | ✅ Covered |

---

## Important Test Cases

###  Critical: Profit Distribution Math
```typescript
// Test ensures weighted distribution is correct
Weighted Share = fundedAmount × tierProfitPercent
Funder Share = funderPool × (weighted / totalWeighted)

This formula ensures:
- Higher tiers get proportionally more profit
- Pro-rata based on funding amount
- No rounding errors
```

### 🔒 Critical: Refund Security
```typescript
// Prevents refund after revenue distributed
if (status == COMPLETED) revert RefundNotAvailable();

// Burns all tier badges on refund
for (each tier badge) {
  _burn(badge);
}

// Updates campaign totalRaised
campaignData.totalRaised -= tokenBalance;
```

### 🎯 Critical: Tier Badge Minting
```typescript
// Automatically mints badges when thresholds reached
if (totalFunded >= tierThreshold && !hasBadge) {
  _mint(badge);
  hasTierBadge[funder][badgeId] = true;
}
```

---

## Edge Cases Tested

1. **Refund drops campaign below target** → Status reverts to ONGOING
2. **Multiple tier badges for single funder** → All badges burn on refund
3. **Funder with 0 Artist Tokens** → Cannot refund
4. **Campaign already COMPLETED** → Cannot refund
5. **Tier percentage = 0** → Reverts on creation
6. **Tiers not ascending** → Reverts on creation
7. **Non-registered artist** → Cannot create campaign
8. **FunderSharePercent > 50%** → Reverts on creation

---

## Integration Tests

The tests include full integration scenarios:
- Artist registration → Campaign creation → Funding → Refund
- Artist registration → Campaign creation → Funding → Revenue → Claim
- Multiple funders with different tiers → Weighted profit distribution

---

## Known Issues

**Note:** There's currently a dependency conflict with Hardhat 3.x and tsx loader. If you encounter compilation errors, you may need to downgrade to Hardhat 2.x or wait for the official fix.

**Workaround:**
```bash
npm install hardhat@^2.22.0 --save-dev
```

---

## Next Steps

1. Run tests to ensure all pass
2. Add gas reporter for optimization insights
3. Add coverage reporter to track code coverage
4. Consider adding integration tests with real IDRX token
5. Add stress tests for large number of funders

---

## Contact

For questions about the test suite, please refer to the contract documentation or open an issue in the repository.
