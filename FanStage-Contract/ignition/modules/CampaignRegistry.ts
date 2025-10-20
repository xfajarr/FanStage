import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ArtistIdentityModule from "./ArtistIdentity";
import MockIDRXModule from "./MockIDRX";

const CampaignRegistryModule = buildModule("CampaignRegistryModule", (m) => {
  // Get dependencies from other modules
  const { artistIdentity } = m.useModule(ArtistIdentityModule);
  const { mockIDRX } = m.useModule(MockIDRXModule);

  // Get parameters with defaults
  const platformWallet = m.getParameter("platformWallet");
  const campaignCreationFee = m.getParameter("campaignCreationFee", 10000n); // 100.00 IDRX

  const campaignRegistry = m.contract("CampaignRegistry", [
    artistIdentity,
    mockIDRX,
    platformWallet,
    campaignCreationFee,
  ]);

  return { campaignRegistry, artistIdentity, mockIDRX };
});

export default CampaignRegistryModule;
