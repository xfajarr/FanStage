import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("\n📍 Deployer Address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.log("\n⚠️  WARNING: Balance is 0! You need Base Sepolia ETH.");
    console.log("🚰 Get testnet ETH from:");
    console.log("   - https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    console.log("   - https://www.alchemy.com/faucets/base-sepolia");
  } else {
    console.log("\n✅ Ready to deploy!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
