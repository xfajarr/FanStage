import { expect } from "chai";
import { ethers } from "hardhat";
import { ArtistIdentity } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ArtistIdentity - Soul-Bound NFT", function () {
  let artistIdentity: ArtistIdentity;
  let owner: SignerWithAddress;
  let artist1: SignerWithAddress;
  let artist2: SignerWithAddress;
  let nonArtist: SignerWithAddress;

  beforeEach(async function () {
    [owner, artist1, artist2, nonArtist] = await ethers.getSigners();

    const ArtistIdentityFactory = await ethers.getContractFactory("ArtistIdentity");
    artistIdentity = await ArtistIdentityFactory.deploy();
  });

  describe("Registration", function () {
    it("Should register artist with correct data", async function () {
      await artistIdentity.connect(artist1).registerArtist(
        "Rizky",
        "ipfs://rizky-profile"
      );

      const isRegistered = await artistIdentity.isRegisteredArtist(artist1.address);
      expect(isRegistered).to.be.true;

      const profile = await artistIdentity.getArtistProfile(artist1.address);
      expect(profile.name).to.equal("Rizky");
      expect(profile.createdAt).to.be.gt(0);
    });

    it("Should mint identity NFT to artist", async function () {
      await artistIdentity.connect(artist1).registerArtist(
        "Rizky",
        "ipfs://rizky-profile"
      );

      const tokenId = await artistIdentity.getArtistTokenId(artist1.address);
      const balance = await artistIdentity.balanceOf(artist1.address);

      expect(balance).to.equal(1);
      expect(tokenId).to.equal(1n);
    });

    it("Should revert if artist name is empty", async function () {
      await expect(
        artistIdentity.connect(artist1).registerArtist("", "ipfs://profile")
      ).to.be.revertedWithCustomError(artistIdentity, "NameEmpty");
    });

    it("Should revert if metadata URI is empty", async function () {
      await expect(
        artistIdentity.connect(artist1).registerArtist("Rizky", "")
      ).to.be.revertedWithCustomError(artistIdentity, "MetadataURIEmpty");
    });

    it("Should revert if artist name already exists", async function () {
      await artistIdentity.connect(artist1).registerArtist(
        "Rizky",
        "ipfs://rizky-profile"
      );

      await expect(
        artistIdentity.connect(artist2).registerArtist(
          "Rizky",
          "ipfs://another-profile"
        )
      ).to.be.revertedWithCustomError(artistIdentity, "ArtistNameExists");
    });

    it("Should revert if artist already registered", async function () {
      await artistIdentity.connect(artist1).registerArtist(
        "Rizky",
        "ipfs://rizky-profile"
      );

      await expect(
        artistIdentity.connect(artist1).registerArtist(
          "Rizky2",
          "ipfs://rizky-profile-2"
        )
      ).to.be.revertedWithCustomError(artistIdentity, "ArtistAlreadyRegistered");
    });

    it("Should increment token IDs for multiple registrations", async function () {
      await artistIdentity.connect(artist1).registerArtist(
        "Rizky",
        "ipfs://rizky-profile"
      );

      await artistIdentity.connect(artist2).registerArtist(
        "Andika",
        "ipfs://andika-profile"
      );

      const tokenId1 = await artistIdentity.getArtistTokenId(artist1.address);
      const tokenId2 = await artistIdentity.getArtistTokenId(artist2.address);

      expect(tokenId1).to.equal(1n);
      expect(tokenId2).to.equal(2n);
    });
  });

  describe("Soul-Bound (Non-Transferable)", function () {
    beforeEach(async function () {
      await artistIdentity.connect(artist1).registerArtist(
        "Rizky",
        "ipfs://rizky-profile"
      );
    });

    it("Should not allow transfers between addresses", async function () {
      const tokenId = await artistIdentity.getArtistTokenId(artist1.address);

      await expect(
        artistIdentity.connect(artist1).transferFrom(
          artist1.address,
          artist2.address,
          tokenId
        )
      ).to.be.revertedWith("ArtistIdentity: Soul-bound token - transfer not allowed");
    });

    it("Should not allow safeTransferFrom", async function () {
      const tokenId = await artistIdentity.getArtistTokenId(artist1.address);

      await expect(
        artistIdentity.connect(artist1)["safeTransferFrom(address,address,uint256)"](
          artist1.address,
          artist2.address,
          tokenId
        )
      ).to.be.revertedWith("ArtistIdentity: Soul-bound token - transfer not allowed");
    });
  });

  describe("Update Profile", function () {
    beforeEach(async function () {
      await artistIdentity.connect(artist1).registerArtist(
        "Rizky",
        "ipfs://rizky-profile"
      );
    });

    it("Should update artist name and metadata", async function () {
      await artistIdentity.connect(artist1).updateProfile(
        "Rizky Official",
        "ipfs://rizky-new-profile"
      );

      const profile = await artistIdentity.getArtistProfile(artist1.address);
      expect(profile.name).to.equal("Rizky Official");

      // Old name should be available now
      const oldNameExists = await artistIdentity.isArtistNameExist("Rizky");
      expect(oldNameExists).to.be.false;

      const newNameExists = await artistIdentity.isArtistNameExist("Rizky Official");
      expect(newNameExists).to.be.true;
    });

    it("Should revert if new name is empty", async function () {
      await expect(
        artistIdentity.connect(artist1).updateProfile("", "ipfs://new-profile")
      ).to.be.revertedWithCustomError(artistIdentity, "NameEmpty");
    });

    it("Should revert if new name already exists", async function () {
      await artistIdentity.connect(artist2).registerArtist(
        "Andika",
        "ipfs://andika-profile"
      );

      await expect(
        artistIdentity.connect(artist1).updateProfile(
          "Andika",
          "ipfs://new-profile"
        )
      ).to.be.revertedWithCustomError(artistIdentity, "ArtistNameExists");
    });

    it("Should revert if caller is not registered artist", async function () {
      await expect(
        artistIdentity.connect(nonArtist).updateProfile(
          "NewName",
          "ipfs://profile"
        )
      ).to.be.revertedWith("Not a registered artist");
    });
  });

  describe("Revoke Identity", function () {
    beforeEach(async function () {
      await artistIdentity.connect(artist1).registerArtist(
        "Rizky",
        "ipfs://rizky-profile"
      );
    });

    it("Should allow owner to revoke artist identity", async function () {
      await artistIdentity.connect(owner).revokeArtistIdentity(artist1.address);

      const isRegistered = await artistIdentity.isRegisteredArtist(artist1.address);
      expect(isRegistered).to.be.false;

      // Check NFT burned
      const balance = await artistIdentity.balanceOf(artist1.address);
      expect(balance).to.equal(0);

      // Check name is available again
      const nameExists = await artistIdentity.isArtistNameExist("Rizky");
      expect(nameExists).to.be.false;
    });

    it("Should revert if caller is not owner", async function () {
      await expect(
        artistIdentity.connect(artist2).revokeArtistIdentity(artist1.address)
      ).to.be.revertedWithCustomError(artistIdentity, "OwnableUnauthorizedAccount");
    });

    it("Should revert if artist is not registered", async function () {
      await expect(
        artistIdentity.connect(owner).revokeArtistIdentity(nonArtist.address)
      ).to.be.revertedWith("Not a registered artist");
    });
  });

  describe("View Functions", function () {
    it("Should return total artists", async function () {
      await artistIdentity.connect(artist1).registerArtist(
        "Rizky",
        "ipfs://rizky-profile"
      );

      await artistIdentity.connect(artist2).registerArtist(
        "Andika",
        "ipfs://andika-profile"
      );

      const total = await artistIdentity.totalArtists();
      expect(total).to.equal(2);
    });

    it("Should return all artists", async function () {
      await artistIdentity.connect(artist1).registerArtist(
        "Rizky",
        "ipfs://rizky-profile"
      );

      await artistIdentity.connect(artist2).registerArtist(
        "Andika",
        "ipfs://andika-profile"
      );

      const [artists, profiles] = await artistIdentity.getAllArtists();

      expect(artists.length).to.equal(2);
      expect(artists[0]).to.equal(artist1.address);
      expect(artists[1]).to.equal(artist2.address);
      expect(profiles[0].name).to.equal("Rizky");
      expect(profiles[1].name).to.equal("Andika");
    });

    it("Should return artist profile by token ID", async function () {
      await artistIdentity.connect(artist1).registerArtist(
        "Rizky",
        "ipfs://rizky-profile"
      );

      const tokenId = await artistIdentity.getArtistTokenId(artist1.address);
      const profile = await artistIdentity.getArtistProfileByTokenId(tokenId);

      expect(profile.name).to.equal("Rizky");
    });

    it("Should return artist by token ID", async function () {
      await artistIdentity.connect(artist1).registerArtist(
        "Rizky",
        "ipfs://rizky-profile"
      );

      const tokenId = await artistIdentity.getArtistTokenId(artist1.address);
      const artistAddress = await artistIdentity.getArtistByTokenId(tokenId);

      expect(artistAddress).to.equal(artist1.address);
    });
  });
});
