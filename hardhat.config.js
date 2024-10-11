require("@nomiclabs/hardhat-waffle");
const fs = require("fs")
const privateKey = fs.readFileSync(".env").toString()
const projectId = "6ce2699f9b0f42bcbf668e429b7df227"

module.exports = {
  networks: {
    hardhat: {
      chainId: 1337,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    amoy: {
      url: `https://polygon-amoy.infura.io/v3/${projectId}`,
      accounts: [privateKey]
    },
    mainnet: {
      url: `https://polygon-mainnet.infura.io/v3/${projectId}`,
      accounts: [privateKey]
    }
  },
  solidity: "0.8.27",
};
