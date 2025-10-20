import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ArtistIdentityModule = buildModule("ArtistIdentityModule", (m) => {
  const artistIdentity = m.contract("ArtistIdentity");

  return { artistIdentity };
});

export default ArtistIdentityModule;
