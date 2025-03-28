require("dotenv").config();
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  solidity: "0.8.28",
  sourcify: {
    enabled: true,
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_HTTP_URL,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    arbitrumSepolia: {
      url: process.env.ALCHEMY_HTTP_URL,
      accounts: [process.env.OWNER_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
