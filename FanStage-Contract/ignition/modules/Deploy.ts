import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import CampaignRegistryModule from "./CampaignRegistry";

const DeployModule = buildModule("DeployModule", (m) => {

  const { campaignRegistry, artistIdentity, mockIDRX } = m.useModule(
    CampaignRegistryModule
  );

  return {
    mockIDRX,
    artistIdentity,
    campaignRegistry,
  };
});

export default DeployModule;
