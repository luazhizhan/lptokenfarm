const { expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("LPTokenFarm.test", function () {
  async function contractsFixture() {
    const [deployer] = await ethers.getSigners();

    // Deploy Reward Token
    const RewardToken = await ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.connect(deployer).deploy();

    const MockLPToken = await ethers.getContractFactory("MockLPToken");
    const lpToken1 = await MockLPToken.connect(deployer).deploy(
      "LP Token 1",
      "LP1",
      ethers.parseEther("1000000")
    );
    const lpToken2 = await MockLPToken.connect(deployer).deploy(
      "LP Token 2",
      "LP2",
      ethers.parseEther("1000000")
    );
    const lpToken3 = await MockLPToken.connect(deployer).deploy(
      "LP Token 3",
      "LP3",
      ethers.parseEther("1000000")
    );

    const currentBlock = await ethers.provider.getBlockNumber();
    const startBlock = currentBlock + 10; // Start 10 blocks from now

    const LPTokenFarm = await ethers.getContractFactory("LPTokenFarm");
    const farm = await LPTokenFarm.connect(deployer).deploy(
      rewardToken.target,
      startBlock
    );

    const farmingRewards = ethers.parseEther("10000000");
    await rewardToken.connect(deployer).transfer(farm.target, farmingRewards);

    // add LP token to the farm
    await farm.connect(deployer).addPool(lpToken1.target, 50);
    await farm.connect(deployer).addPool(lpToken2.target, 30);
    await farm.connect(deployer).addPool(lpToken3.target, 20);

    expect(await farm.poolLength()).to.be.equal(3);
    return { rewardToken, lpToken1, lpToken2, lpToken3, farm };
  }

  it("should update pending rewards correctly", async function () {
    const [deployer] = await ethers.getSigners();

    const { lpToken1, farm } = await contractsFixture();

    await lpToken1
      .connect(deployer)
      .approve(farm.target, ethers.parseEther("1"));
    await farm.connect(deployer).deposit(0, ethers.parseEther("1"));

    await helpers.mine(4);

    // check pending rewards
    const pendingRewards = await farm.pendingRewards(0, deployer.address);
    expect(pendingRewards).to.be.eq(ethers.parseEther("100"));
  });
});
