// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Reward Token
  const RewardToken = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  console.log("RewardToken deployed to:", rewardToken.target);

  // Deploy LP Tokens for testing
  const MockLPToken = await ethers.getContractFactory("MockLPToken");

  const lpToken1 = await MockLPToken.deploy(
    "LP Token 1",
    "LP1",
    ethers.parseEther("1000000")
  );
  console.log("LP Token 1 deployed to:", lpToken1.target);

  const lpToken2 = await MockLPToken.deploy(
    "LP Token 2",
    "LP2",
    ethers.parseEther("1000000")
  );
  console.log("LP Token 2 deployed to:", lpToken2.target);

  const lpToken3 = await MockLPToken.deploy(
    "LP Token 3",
    "LP3",
    ethers.parseEther("1000000")
  );
  console.log("LP Token 3 deployed to:", lpToken3.target);

  // Deploy Farm with current block as start block
  const currentBlock = await ethers.provider.getBlockNumber();
  const startBlock = currentBlock + 10; // Start 10 blocks from now

  const LPTokenFarm = await ethers.getContractFactory("LPTokenFarm");
  const farm = await LPTokenFarm.deploy(rewardToken.target, startBlock);
  console.log("LPTokenFarm deployed to:", farm.target);

  // Transfer reward tokens to the farm
  const farmingRewards = ethers.parseEther("10000000"); // 10 million tokens
  await rewardToken.transfer(farm.target, farmingRewards);
  console.log(
    "Transferred",
    ethers.formatEther(farmingRewards),
    "reward tokens to the farm"
  );

  // Add LP tokens to the farm with proportional allocation
  console.log("Adding LP tokens to farm...");
  await farm.addPool(lpToken1.target, 50); // 50% allocation
  await farm.addPool(lpToken2.target, 30); // 30% allocation
  await farm.addPool(lpToken3.target, 20); // 20% allocation
  console.log("Added 3 LP tokens to farm with 50:30:20 allocation");

  console.log("Deployment and setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
