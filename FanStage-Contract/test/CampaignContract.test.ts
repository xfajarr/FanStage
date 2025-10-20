import { expect } from "chai";
import { ethers } from "hardhat";
import { ArtistIdentity, CampaignContract, ArtistToken, CampaignRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("CampaignContract - Fanetic Stage", function () {
  let artistIdentity: ArtistIdentity;
  let campaignRegistry: CampaignRegistry;
  let campaignContract: CampaignContract;
  let artistToken: ArtistToken;
  let idrxToken: any;

  let owner: SignerWithAddress;
  let artist: SignerWithAddress;
  let funder1: SignerWithAddress;
  let funder2: SignerWithAddress;
  let funder3: SignerWithAddress;
  let platformWallet: SignerWithAddress;

  const CAMPAIGN_NFT_ID = 0n;
  const BRONZE_BADGE_ID = 2n;
  const SILVER_BADGE_ID = 3n;
  const GOLD_BADGE_ID = 4n;

  const FUNDING_TARGET = ethers.parseUnits("100000", 2); // 100,000.00 IDRX
  const FUNDER_SHARE_PERCENT = 30n; // 30% to funders

  // Helper function to create campaign
  async function deployCampaign() {
    const duration = 30 * 24 * 60 * 60; // 30 days

    const tiers = [
      {
        name: "Bronze",
        threshold: ethers.parseUnits("100", 2), // 100.00 IDRX
        profitPercent: 1n,
        benefits: "ipfs://bronze-benefits"
      },
      {
        name: "Silver",
        threshold: ethers.parseUnits("1000", 2), // 1,000.00 IDRX
        profitPercent: 2n,
        benefits: "ipfs://silver-benefits"
      },
      {
        name: "Gold",
        threshold: ethers.parseUnits("10000", 2), // 10,000.00 IDRX
        profitPercent: 3n,
        benefits: "ipfs://gold-benefits"
      }
    ];

    await idrxToken.connect(artist).approve(
      await campaignRegistry.getAddress(),
      ethers.parseUnits("1000", 2)
    );

    const tx = await campaignRegistry.connect(artist).createCampaign(
      "ipfs://campaign-metadata",
      FUNDING_TARGET,
      duration,
      FUNDER_SHARE_PERCENT,
      tiers,
      "FANETIC-RIZKY",
      "Rizky World Tour 2025"
    );

    const receipt = await tx.wait();
    const event = receipt?.logs.find((log: any) => {
      try {
        return campaignRegistry.interface.parseLog(log)?.name === "CampaignCreated";
      } catch {
        return false;
      }
    });

    const campaignAddress = (campaignRegistry.interface.parseLog(event as any) as any).args.campaignContract;
    campaignContract = await ethers.getContractAt("CampaignContract", campaignAddress);

    const artistTokenAddress = await campaignContract.getArtistTokenAddress();
    artistToken = await ethers.getContractAt("ArtistToken", artistTokenAddress);
  }

  beforeEach(async function () {
    [owner, artist, funder1, funder2, funder3, platformWallet] = await ethers.getSigners();

    // Deploy Mock IDRX Token (ERC20)
    const MockIDRX = await ethers.getContractFactory("MockIDRX");
    idrxToken = await MockIDRX.deploy();

    // Mint IDRX to test accounts
    await idrxToken.mint(artist.address, ethers.parseUnits("1000000", 2));
    await idrxToken.mint(funder1.address, ethers.parseUnits("100000", 2));
    await idrxToken.mint(funder2.address, ethers.parseUnits("100000", 2));
    await idrxToken.mint(funder3.address, ethers.parseUnits("100000", 2));

    // Deploy ArtistIdentity
    const ArtistIdentityFactory = await ethers.getContractFactory("ArtistIdentity");
    artistIdentity = await ArtistIdentityFactory.deploy();

    // Register artist
    await artistIdentity.connect(artist).registerArtist(
      "Rizky",
      "ipfs://rizky-profile"
    );

    // Deploy CampaignRegistry
    const CampaignRegistryFactory = await ethers.getContractFactory("CampaignRegistry");
    campaignRegistry = await CampaignRegistryFactory.deploy(
      await artistIdentity.getAddress(),
      await idrxToken.getAddress(),
      platformWallet.address,
      ethers.parseUnits("100", 2) // 100 IDRX creation fee
    );

    await deployCampaign();
  });

  describe("Campaign Creation", function () {
    it("Should deploy campaign with correct parameters", async function () {
      const campaignData = await campaignContract.getCampaignData();

      expect(campaignData.artist).to.equal(artist.address);
      expect(campaignData.funderSharePercent).to.equal(FUNDER_SHARE_PERCENT);
      expect(campaignData.targetAmount).to.equal(FUNDING_TARGET);
      expect(campaignData.totalRaised).to.equal(0);
      expect(campaignData.status).to.equal(0); // ONGOING
    });

    it("Should mint Campaign NFT to artist", async function () {
      const balance = await campaignContract.balanceOf(artist.address, CAMPAIGN_NFT_ID);
      expect(balance).to.equal(1);
    });

    it("Should create Artist Token (ERC-20)", async function () {
      const artistTokenAddress = await campaignContract.getArtistTokenAddress();
      expect(artistTokenAddress).to.not.equal(ethers.ZeroAddress);

      const name = await artistToken.name();
      expect(name).to.equal("FANETIC-RIZKY");
    });

    it("Should have correct tiers configured", async function () {
      const tiers = await campaignContract.getTiers();
      expect(tiers.length).to.equal(3);
      expect(tiers[0].name).to.equal("Bronze");
      expect(tiers[0].profitPercent).to.equal(1n);
      expect(tiers[1].name).to.equal("Silver");
      expect(tiers[1].profitPercent).to.equal(2n);
      expect(tiers[2].name).to.equal("Gold");
      expect(tiers[2].profitPercent).to.equal(3n);
    });
  });

  describe("Funding", function () {
    it("Should allow funding and mint Artist Tokens", async function () {
      const fundAmount = ethers.parseUnits("1000", 2); // 1,000.00 IDRX

      await idrxToken.connect(funder1).approve(
        await campaignContract.getAddress(),
        fundAmount
      );

      await campaignContract.connect(funder1).fund(fundAmount);

      // Check Artist Token balance (ERC-20)
      const tokenBalance = await artistToken.balanceOf(funder1.address);
      expect(tokenBalance).to.equal(fundAmount);

      // Check campaign state
      const campaignData = await campaignContract.getCampaignData();
      expect(campaignData.totalRaised).to.equal(fundAmount);
    });

    it("Should mint Bronze badge when threshold reached", async function () {
      const fundAmount = ethers.parseUnits("100", 2); // 100.00 IDRX (Bronze threshold)

      await idrxToken.connect(funder1).approve(
        await campaignContract.getAddress(),
        fundAmount
      );

      await campaignContract.connect(funder1).fund(fundAmount);

      // Check badge
      const hasBadge = await campaignContract.hasBadge(funder1.address, BRONZE_BADGE_ID);
      expect(hasBadge).to.be.true;
    });

    it("Should mint Silver badge when threshold reached", async function () {
      const fundAmount = ethers.parseUnits("1000", 2); // 1,000.00 IDRX (Silver threshold)

      await idrxToken.connect(funder1).approve(
        await campaignContract.getAddress(),
        fundAmount
      );

      await campaignContract.connect(funder1).fund(fundAmount);

      // Check badges
      const hasBronze = await campaignContract.hasBadge(funder1.address, BRONZE_BADGE_ID);
      const hasSilver = await campaignContract.hasBadge(funder1.address, SILVER_BADGE_ID);

      expect(hasBronze).to.be.true;
      expect(hasSilver).to.be.true;
    });

    it("Should change status to FUNDED when target reached", async function () {
      await idrxToken.connect(funder1).approve(
        await campaignContract.getAddress(),
        FUNDING_TARGET
      );

      await campaignContract.connect(funder1).fund(FUNDING_TARGET);

      const campaignData = await campaignContract.getCampaignData();
      expect(campaignData.status).to.equal(1); // FUNDED
    });

    it("Should revert if funding with 0 amount", async function () {
      await expect(
        campaignContract.connect(funder1).fund(0)
      ).to.be.revertedWithCustomError(campaignContract, "InvalidAmount");
    });
  });

  describe("Refund System", function () {
    beforeEach(async function () {
      const fundAmount = ethers.parseUnits("10000", 2); // 10,000.00 IDRX (Gold tier)

      await idrxToken.connect(funder1).approve(
        await campaignContract.getAddress(),
        fundAmount
      );

      await campaignContract.connect(funder1).fund(fundAmount);
    });

    it("Should allow refund during ONGOING status", async function () {
      const initialBalance = await idrxToken.balanceOf(funder1.address);
      const fundedAmount = ethers.parseUnits("10000", 2);

      await campaignContract.connect(funder1).refund();

      // Check IDRX returned
      const finalBalance = await idrxToken.balanceOf(funder1.address);
      expect(finalBalance).to.equal(initialBalance + fundedAmount);

      // Check Artist Tokens burned
      const artistTokenBalance = await artistToken.balanceOf(funder1.address);
      expect(artistTokenBalance).to.equal(0);

      // Check totalRaised updated
      const campaignData = await campaignContract.getCampaignData();
      expect(campaignData.totalRaised).to.equal(0);
    });

    it("Should burn all tier badges on refund", async function () {
      // Initially has Gold, Silver, Bronze badges
      let hasBronze = await campaignContract.hasBadge(funder1.address, BRONZE_BADGE_ID);
      let hasSilver = await campaignContract.hasBadge(funder1.address, SILVER_BADGE_ID);
      let hasGold = await campaignContract.hasBadge(funder1.address, GOLD_BADGE_ID);

      expect(hasBronze).to.be.true;
      expect(hasSilver).to.be.true;
      expect(hasGold).to.be.true;

      // Refund
      await campaignContract.connect(funder1).refund();

      // Check all badges burned
      hasBronze = await campaignContract.hasBadge(funder1.address, BRONZE_BADGE_ID);
      hasSilver = await campaignContract.hasBadge(funder1.address, SILVER_BADGE_ID);
      hasGold = await campaignContract.hasBadge(funder1.address, GOLD_BADGE_ID);

      expect(hasBronze).to.be.false;
      expect(hasSilver).to.be.false;
      expect(hasGold).to.be.false;
    });

    it("Should revert status from FUNDED to ONGOING if below target after refund", async function () {
      // Reach target
      const additionalFund = FUNDING_TARGET - ethers.parseUnits("10000", 2);
      await idrxToken.connect(funder2).approve(
        await campaignContract.getAddress(),
        additionalFund
      );
      await campaignContract.connect(funder2).fund(additionalFund);

      let campaignData = await campaignContract.getCampaignData();
      expect(campaignData.status).to.equal(1); // FUNDED

      // Funder1 refunds, drops below target
      await campaignContract.connect(funder1).refund();

      campaignData = await campaignContract.getCampaignData();
      expect(campaignData.status).to.equal(0); // ONGOING
    });

    it("Should not allow refund after COMPLETED", async function () {
      // Reach target
      const additionalFund = FUNDING_TARGET - ethers.parseUnits("10000", 2);
      await idrxToken.connect(funder2).approve(
        await campaignContract.getAddress(),
        additionalFund
      );
      await campaignContract.connect(funder2).fund(additionalFund);

      // Submit revenue
      const revenueAmount = ethers.parseUnits("50000", 2);
      await idrxToken.connect(artist).approve(
        await campaignContract.getAddress(),
        revenueAmount
      );
      await campaignContract.connect(artist).submitRevenue(revenueAmount);

      // Try to refund
      await expect(
        campaignContract.connect(funder1).refund()
      ).to.be.revertedWithCustomError(campaignContract, "RefundNotAvailable");
    });
  });

  describe("Profit Sharing (Tier-Based)", function () {
    beforeEach(async function () {
      // Funder1: 50,000 IDRX → Gold tier (3%)
      const fund1 = ethers.parseUnits("50000", 2);
      await idrxToken.connect(funder1).approve(
        await campaignContract.getAddress(),
        fund1
      );
      await campaignContract.connect(funder1).fund(fund1);

      // Funder2: 30,000 IDRX → Gold tier (3%)
      const fund2 = ethers.parseUnits("30000", 2);
      await idrxToken.connect(funder2).approve(
        await campaignContract.getAddress(),
        fund2
      );
      await campaignContract.connect(funder2).fund(fund2);

      // Funder3: 20,000 IDRX → Gold tier (3%)
      const fund3 = ethers.parseUnits("20000", 2);
      await idrxToken.connect(funder3).approve(
        await campaignContract.getAddress(),
        fund3
      );
      await campaignContract.connect(funder3).fund(fund3);

      // Total raised: 100,000 IDRX (reached target)
    });

    it("Should distribute revenue with tier-based weighting", async function () {
      const revenueAmount = ethers.parseUnits("100000", 2); // 100,000 IDRX revenue

      await idrxToken.connect(artist).approve(
        await campaignContract.getAddress(),
        revenueAmount
      );

      const artistInitialBalance = await idrxToken.balanceOf(artist.address);

      await campaignContract.connect(artist).submitRevenue(revenueAmount);

      // Check artist net change: deposited 100,000, received back 70,000 = -30,000 net
      const artistFinalBalance = await idrxToken.balanceOf(artist.address);
      const artistNetChange = ethers.parseUnits("-30000", 2); // Artist pays funders their share
      expect(artistFinalBalance - artistInitialBalance).to.be.closeTo(
        artistNetChange,
        ethers.parseUnits("1", 2) // Allow 1 IDRX rounding
      );

      // Check funder pool: 30% = 30,000 IDRX
      // All funders have Gold tier (3%)
      // Weighted: funder1 = 150,000, funder2 = 90,000, funder3 = 60,000
      // Total weighted = 300,000

      const claimable1 = await campaignContract.claimableRevenue(funder1.address);
      const claimable2 = await campaignContract.claimableRevenue(funder2.address);
      const claimable3 = await campaignContract.claimableRevenue(funder3.address);

      // Funder1: 30,000 * (150,000 / 300,000) = 15,000
      expect(claimable1).to.be.closeTo(
        ethers.parseUnits("15000", 2),
        ethers.parseUnits("1", 2)
      );

      // Funder2: 30,000 * (90,000 / 300,000) = 9,000
      expect(claimable2).to.be.closeTo(
        ethers.parseUnits("9000", 2),
        ethers.parseUnits("1", 2)
      );

      // Funder3: 30,000 * (60,000 / 300,000) = 6,000
      expect(claimable3).to.be.closeTo(
        ethers.parseUnits("6000", 2),
        ethers.parseUnits("1", 2)
      );
    });

    it("Should allow funders to claim revenue", async function () {
      const revenueAmount = ethers.parseUnits("100000", 2);

      await idrxToken.connect(artist).approve(
        await campaignContract.getAddress(),
        revenueAmount
      );
      await campaignContract.connect(artist).submitRevenue(revenueAmount);

      const funder1InitialBalance = await idrxToken.balanceOf(funder1.address);
      const claimable = await campaignContract.claimableRevenue(funder1.address);

      await campaignContract.connect(funder1).claimRevenue();

      const funder1FinalBalance = await idrxToken.balanceOf(funder1.address);
      expect(funder1FinalBalance - funder1InitialBalance).to.equal(claimable);

      // Check claimable reset to 0
      const claimableAfter = await campaignContract.claimableRevenue(funder1.address);
      expect(claimableAfter).to.equal(0);
    });

    it("Should weight profit by tier percentage", async function () {
      // Submit revenue to existing campaign (from beforeEach)
      // Funder1: 50,000 IDRX → Gold tier (3%)
      // Funder2: 30,000 IDRX → Gold tier (3%)
      // Funder3: 20,000 IDRX → Gold tier (3%)

      const revenueAmount = ethers.parseUnits("100000", 2);
      await idrxToken.connect(artist).approve(
        await campaignContract.getAddress(),
        revenueAmount
      );
      await campaignContract.connect(artist).submitRevenue(revenueAmount);

      // All funders have same tier (Gold 3%), so profit is proportional to funding
      // Funder1 (50k) should get more than Funder2 (30k) should get more than Funder3 (20k)
      const claimable1 = await campaignContract.claimableRevenue(funder1.address);
      const claimable2 = await campaignContract.claimableRevenue(funder2.address);
      const claimable3 = await campaignContract.claimableRevenue(funder3.address);

      expect(claimable1).to.be.gt(claimable2);
      expect(claimable2).to.be.gt(claimable3);
    });

    it("Should change status to COMPLETED after revenue submission", async function () {
      const revenueAmount = ethers.parseUnits("100000", 2);

      await idrxToken.connect(artist).approve(
        await campaignContract.getAddress(),
        revenueAmount
      );
      await campaignContract.connect(artist).submitRevenue(revenueAmount);

      const campaignData = await campaignContract.getCampaignData();
      expect(campaignData.status).to.equal(2); // COMPLETED
      expect(campaignData.totalRevenue).to.equal(revenueAmount);
    });
  });

  describe("View Functions", function () {
    it("Should return correct funder info", async function () {
      const fundAmount = ethers.parseUnits("1000", 2);

      await idrxToken.connect(funder1).approve(
        await campaignContract.getAddress(),
        fundAmount
      );
      await campaignContract.connect(funder1).fund(fundAmount);

      const funderInfo = await campaignContract.getFunderInfo(funder1.address);

      expect(funderInfo.totalFunded).to.equal(fundAmount);
      expect(funderInfo.highestTier).to.equal(1); // Silver tier (index 1)
    });

    it("Should return correct total funders", async function () {
      const fundAmount = ethers.parseUnits("100", 2);

      await idrxToken.connect(funder1).approve(
        await campaignContract.getAddress(),
        fundAmount
      );
      await campaignContract.connect(funder1).fund(fundAmount);

      await idrxToken.connect(funder2).approve(
        await campaignContract.getAddress(),
        fundAmount
      );
      await campaignContract.connect(funder2).fund(fundAmount);

      const totalFunders = await campaignContract.getTotalFunders();
      expect(totalFunders).to.equal(2);
    });
  });
});
