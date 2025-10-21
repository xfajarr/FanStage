
import { ethers } from "hardhat";
import { ContractFactory } from "ethers";

async function main() {
  console.log("Starting deployment...");

  // Deploy MockIDRX first
  console.log("Deploying MockIDRX...");
  const MockIDRX = await ethers.getContractFactory("MockIDRX");
  const mockIDRX = await MockIDRX.deploy();
  await mockIDRX.deployed();
  console.log("MockIDRX deployed to:", mockIDRX.address);

  // Deploy ArtistIdentity
  console.log("Deploying ArtistIdentity...");
  const ArtistIdentity = await ethers.getContractFactory("ArtistIdentity");
  const artistIdentity = await ArtistIdentity.deploy();
  await artistIdentity.deployed();
  console.log("ArtistIdentity deployed to:", artistIdentity.address);

  // Deploy CampaignRegistry
  console.log("Deploying CampaignRegistry...");
  const CampaignRegistry = await ethers.getContractFactory("CampaignRegistry");
  const campaignRegistry = await CampaignRegistry.deploy(
    mockIDRX.address,
    artistIdentity.address
  );
  await campaignRegistry.deployed();
  console.log("CampaignRegistry deployed to:", campaignRegistry.address);

  console.log("   Campaign Creation Fee:", campaignCreationFee, "(with 2 decimals)\n");

  // 1. Deploy MockIDRX
  console.log("📝 Deploying MockIDRX...");
  const MockIDRX = await ethers.getContractFactory("MockIDRX");
  const mockIDRX = await MockIDRX.deploy();
  await mockIDRX.waitForDeployment();
  const mockIDRXAddress = await mockIDRX.getAddress();
  console.log("✅ MockIDRX deployed to:", mockIDRXAddress, "\n");

  // 2. Deploy ArtistIdentity
  console.log("📝 Deploying ArtistIdentity...");
  const ArtistIdentity = await ethers.getContractFactory("ArtistIdentity");
  const artistIdentity = await ArtistIdentity.deploy();
  await artistIdentity.waitForDeployment();
  const artistIdentityAddress = await artistIdentity.getAddress();
  console.log("✅ ArtistIdentity deployed to:", artistIdentityAddress, "\n");

  // 3. Deploy CampaignRegistry
  console.log("📝 Deploying CampaignRegistry...");
  const CampaignRegistry = await ethers.getContractFactory("CampaignRegistry");
  const campaignRegistry = await CampaignRegistry.deploy(
    artistIdentityAddress,
    mockIDRXAddress,
    platformWallet,
    campaignCreationFee
  );
  await campaignRegistry.waitForDeployment();
  const campaignRegistryAddress = await campaignRegistry.getAddress();
  console.log("✅ CampaignRegistry deployed to:", campaignRegistryAddress, "\n");

  // Summary
  console.log("=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n📋 Deployed Contract Addresses:");
  console.log("   MockIDRX:          ", mockIDRXAddress);
  console.log("   ArtistIdentity:    ", artistIdentityAddress);
  console.log("   CampaignRegistry:  ", campaignRegistryAddress);

  console.log("\n🔍 Block Explorer:");
  console.log("   MockIDRX:          https://sepolia.basescan.org/address/" + mockIDRXAddress);
  console.log("   ArtistIdentity:    https://sepolia.basescan.org/address/" + artistIdentityAddress);
  console.log("   CampaignRegistry:  https://sepolia.basescan.org/address/" + campaignRegistryAddress);

  console.log("\n✅ Verify Contracts:");
  console.log(`   npx hardhat verify --network base-sepolia ${mockIDRXAddress}`);
  console.log(`   npx hardhat verify --network base-sepolia ${artistIdentityAddress}`);
  console.log(`   npx hardhat verify --network base-sepolia ${campaignRegistryAddress} ${artistIdentityAddress} ${mockIDRXAddress} ${platformWallet} ${campaignCreationFee}`);

  // Save deployment info
  const deploymentInfo = {
    network: "base-sepolia",
    chainId: 84532,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MockIDRX: mockIDRXAddress,
      ArtistIdentity: artistIdentityAddress,
      CampaignRegistry: campaignRegistryAddress,
    },
    config: {
      platformWallet,
      campaignCreationFee,
    },
    blockExplorer: {
      MockIDRX: `https://sepolia.basescan.org/address/${mockIDRXAddress}`,
      ArtistIdentity: `https://sepolia.basescan.org/address/${artistIdentityAddress}`,
      CampaignRegistry: `https://sepolia.basescan.org/address/${campaignRegistryAddress}`,
    },
    verifyCommands: {
      MockIDRX: `npx hardhat verify --network base-sepolia ${mockIDRXAddress}`,
      ArtistIdentity: `npx hardhat verify --network base-sepolia ${artistIdentityAddress}`,
      CampaignRegistry: `npx hardhat verify --network base-sepolia ${campaignRegistryAddress} ${artistIdentityAddress} ${mockIDRXAddress} ${platformWallet} ${campaignCreationFee}`,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `base-sepolia-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n📄 Deployment info saved to: deployments/${filename}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
