import { expect } from "chai";
import { ethers } from "hardhat";
import { ArtistIdentity, CampaignRegistry, CampaignContract } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CampaignRegistry - Campaign Factory", function () {
  let artistIdentity: ArtistIdentity;
  let campaignRegistry: CampaignRegistry;
  let idrxToken: any;

  let owner: SignerWithAddress;
  let artist: SignerWithAddress;
  let nonArtist: SignerWithAddress;
  let platformWallet: SignerWithAddress;

  const CREATION_FEE = ethers.parseUnits("100", 2); // 100.00 IDRX

  beforeEach(async function () {
    [owner, artist, nonArtist, platformWallet] = await ethers.getSigners();

    // Deploy Mock IDRX Token
    const MockIDRX = await ethers.getContractFactory("MockIDRX");
    idrxToken = await MockIDRX.deploy();

    // Mint IDRX
    await idrxToken.mint(artist.address, ethers.parseUnits("100000", 2));
    await idrxToken.mint(nonArtist.address, ethers.parseUnits("100000", 2));

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
      CREATION_FEE
    );
  });

  describe("Deployment", function () {
    it("Should set correct initial values", async function () {
      expect(await campaignRegistry.artistIdentity()).to.equal(
        await artistIdentity.getAddress()
      );
      expect(await campaignRegistry.IDRX()).to.equal(await idrxToken.getAddress());
      expect(await campaignRegistry.platformWallet()).to.equal(platformWallet.address);
      expect(await campaignRegistry.campaignCreationFee()).to.equal(CREATION_FEE);
      expect(await campaignRegistry.owner()).to.equal(owner.address);
    });

    it("Should start with 0 campaigns", async function () {
      const totalCampaigns = await campaignRegistry.getTotalCampaigns();
      expect(totalCampaigns).to.equal(0);
    });
  });

  describe("Campaign Creation", function () {
    const tiers = [
      {
        name: "Bronze",
        threshold: ethers.parseUnits("100", 2),
        profitPercent: 1n,
        benefits: "ipfs://bronze"
      },
      {
        name: "Silver",
        threshold: ethers.parseUnits("1000", 2),
        profitPercent: 2n,
        benefits: "ipfs://silver"
      },
      {
        name: "Gold",
        threshold: ethers.parseUnits("10000", 2),
        profitPercent: 3n,
        benefits: "ipfs://gold"
      }
    ];

    it("Should create campaign successfully", async function () {
      await idrxToken.connect(artist).approve(
        await campaignRegistry.getAddress(),
        CREATION_FEE
      );

      const tx = await campaignRegistry.connect(artist).createCampaign(
        "ipfs://campaign-metadata",
        ethers.parseUnits("100000", 2),
        30 * 24 * 60 * 60,
        30n,
        tiers,
        "FANETIC-RIZKY",
        "Rizky World Tour 2025"
      );

      const receipt = await tx.wait();

      // Check CampaignCreated event
      const event = receipt?.logs.find((log: any) => {
        try {
          return campaignRegistry.interface.parseLog(log)?.name === "CampaignCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      const totalCampaigns = await campaignRegistry.getTotalCampaigns();
      expect(totalCampaigns).to.equal(1);
    });

    it("Should charge creation fee to artist", async function () {
      await idrxToken.connect(artist).approve(
        await campaignRegistry.getAddress(),
        CREATION_FEE
      );

      const platformInitialBalance = await idrxToken.balanceOf(platformWallet.address);

      await campaignRegistry.connect(artist).createCampaign(
        "ipfs://campaign-metadata",
        ethers.parseUnits("100000", 2),
        30 * 24 * 60 * 60,
        30n,
        tiers,
        "FANETIC-RIZKY",
        "Rizky World Tour 2025"
      );

      const platformFinalBalance = await idrxToken.balanceOf(platformWallet.address);
      expect(platformFinalBalance - platformInitialBalance).to.equal(CREATION_FEE);
    });

    it("Should track artist campaigns", async function () {
      await idrxToken.connect(artist).approve(
        await campaignRegistry.getAddress(),
        CREATION_FEE
      );

      await campaignRegistry.connect(artist).createCampaign(
        "ipfs://campaign-metadata",
        ethers.parseUnits("100000", 2),
        30 * 24 * 60 * 60,
        30n,
        tiers,
        "FANETIC-RIZKY",
        "Rizky World Tour 2025"
      );

      const artistCampaigns = await campaignRegistry.getArtistCampaigns(artist.address);
      expect(artistCampaigns.length).to.equal(1);
      expect(artistCampaigns[0]).to.equal(0);
    });

    it("Should revert if caller is not registered artist", async function () {
      await idrxToken.connect(nonArtist).approve(
        await campaignRegistry.getAddress(),
        CREATION_FEE
      );

      await expect(
        campaignRegistry.connect(nonArtist).createCampaign(
          "ipfs://campaign-metadata",
          ethers.parseUnits("100000", 2),
          30 * 24 * 60 * 60,
          30n,
          tiers,
          "FANETIC-TEST",
          "Test Campaign"
        )
      ).to.be.revertedWithCustomError(campaignRegistry, "NotRegisteredArtist");
    });

    it("Should revert if funderSharePercent > 50%", async function () {
      await idrxToken.connect(artist).approve(
        await campaignRegistry.getAddress(),
        CREATION_FEE
      );

      await expect(
        campaignRegistry.connect(artist).createCampaign(
          "ipfs://campaign-metadata",
          ethers.parseUnits("100000", 2),
          30 * 24 * 60 * 60,
          51n, // 51%
          tiers,
          "FANETIC-RIZKY",
          "Rizky World Tour 2025"
        )
      ).to.be.revertedWithCustomError(campaignRegistry, "FunderShareTooHigh");
    });

    it("Should revert if no tiers provided", async function () {
      await idrxToken.connect(artist).approve(
        await campaignRegistry.getAddress(),
        CREATION_FEE
      );

      await expect(
        campaignRegistry.connect(artist).createCampaign(
          "ipfs://campaign-metadata",
          ethers.parseUnits("100000", 2),
          30 * 24 * 60 * 60,
          30n,
          [], // No tiers
          "FANETIC-RIZKY",
          "Rizky World Tour 2025"
        )
      ).to.be.revertedWithCustomError(campaignRegistry, "NoTiersProvided");
    });

    it("Should revert if tier profitPercent is 0", async function () {
      await idrxToken.connect(artist).approve(
        await campaignRegistry.getAddress(),
        CREATION_FEE
      );

      const invalidTiers = [
        {
          name: "Bronze",
          threshold: ethers.parseUnits("100", 2),
          profitPercent: 0n, // Invalid
          benefits: "ipfs://bronze"
        }
      ];

      await expect(
        campaignRegistry.connect(artist).createCampaign(
          "ipfs://campaign-metadata",
          ethers.parseUnits("100000", 2),
          30 * 24 * 60 * 60,
          30n,
          invalidTiers,
          "FANETIC-RIZKY",
          "Rizky World Tour 2025"
        )
      ).to.be.revertedWithCustomError(campaignRegistry, "InvalidTierProfitPercent");
    });

    it("Should revert if tiers are not in ascending order", async function () {
      await idrxToken.connect(artist).approve(
        await campaignRegistry.getAddress(),
        CREATION_FEE
      );

      const invalidTiers = [
        {
          name: "Gold",
          threshold: ethers.parseUnits("10000", 2),
          profitPercent: 3n,
          benefits: "ipfs://gold"
        },
        {
          name: "Bronze",
          threshold: ethers.parseUnits("100", 2), // Lower threshold after higher
          profitPercent: 1n,
          benefits: "ipfs://bronze"
        }
      ];

      await expect(
        campaignRegistry.connect(artist).createCampaign(
          "ipfs://campaign-metadata",
          ethers.parseUnits("100000", 2),
          30 * 24 * 60 * 60,
          30n,
          invalidTiers,
          "FANETIC-RIZKY",
          "Rizky World Tour 2025"
        )
      ).to.be.revertedWithCustomError(campaignRegistry, "TiersNotAscending");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const tiers = [
        {
          name: "Bronze",
          threshold: ethers.parseUnits("100", 2),
          profitPercent: 1n,
          benefits: "ipfs://bronze"
        }
      ];

      await idrxToken.connect(artist).approve(
        await campaignRegistry.getAddress(),
        CREATION_FEE
      );

      await campaignRegistry.connect(artist).createCampaign(
        "ipfs://campaign-metadata",
        ethers.parseUnits("100000", 2),
        30 * 24 * 60 * 60,
        30n,
        tiers,
        "FANETIC-RIZKY",
        "Rizky World Tour 2025"
      );
    });

    it("Should return campaign contract address", async function () {
      const campaignAddress = await campaignRegistry.getCampaignContract(0);
      expect(campaignAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should check if campaign exists", async function () {
      const exists0 = await campaignRegistry.campaignExists(0);
      const exists1 = await campaignRegistry.campaignExists(1);

      expect(exists0).to.be.true;
      expect(exists1).to.be.false;
    });

    it("Should return campaign ID by address", async function () {
      const campaignAddress = await campaignRegistry.getCampaignContract(0);
      const campaignId = await campaignRegistry.getCampaignId(campaignAddress);

      expect(campaignId).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform wallet", async function () {
      const newWallet = nonArtist.address;

      await campaignRegistry.connect(owner).setPlatformWallet(newWallet);

      const platformWallet = await campaignRegistry.platformWallet();
      expect(platformWallet).to.equal(newWallet);
    });

    it("Should revert if non-owner tries to update platform wallet", async function () {
      await expect(
        campaignRegistry.connect(artist).setPlatformWallet(nonArtist.address)
      ).to.be.revertedWithCustomError(campaignRegistry, "NotOwner");
    });

    it("Should allow owner to update creation fee", async function () {
      const newFee = ethers.parseUnits("200", 2);

      await campaignRegistry.connect(owner).setCampaignCreationFee(newFee);

      const fee = await campaignRegistry.campaignCreationFee();
      expect(fee).to.equal(newFee);
    });

    it("Should allow owner to transfer ownership", async function () {
      await campaignRegistry.connect(owner).transferOwnership(artist.address);

      const newOwner = await campaignRegistry.owner();
      expect(newOwner).to.equal(artist.address);
    });
  });
});
