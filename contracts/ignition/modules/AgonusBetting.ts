import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AgonusBettingModule", (m) => {
  const agonusBetting = m.contract("AgonusBetting");
  return { agonusBetting };
});
