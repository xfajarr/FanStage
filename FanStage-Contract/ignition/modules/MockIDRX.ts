import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MockIDRXModule = buildModule("MockIDRXModule", (m) => {
  const mockIDRX = m.contract("MockIDRX");

  return { mockIDRX };
});

export default MockIDRXModule;
