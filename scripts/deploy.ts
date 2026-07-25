import { ethers } from "hardhat";

/**
 * Deploys UndoPayEscrow to whichever network Hardhat is configured for.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network <network>
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying UndoPayEscrow with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const UndoPayEscrow = await ethers.getContractFactory("UndoPayEscrow");
  const escrow = await UndoPayEscrow.deploy();

  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log("UndoPayEscrow deployed to:", address);
  console.log("Contract owner (can pause/unpause):", deployer.address);

  // Small delay before verification attempts on live networks
  if (process.env.HARDHAT_NETWORK !== "hardhat" && process.env.HARDHAT_NETWORK !== "localhost") {
    console.log("Waiting for block confirmations before verification...");
    const deployTx = escrow.deploymentTransaction();
    if (deployTx) {
      await deployTx.wait(5);
    }

    try {
      const hre = require("hardhat");
      await hre.run("verify:verify", {
        address,
        constructorArguments: [],
      });
      console.log("Contract verified on block explorer.");
    } catch (err) {
      console.log("Verification skipped/failed:", (err as Error).message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
