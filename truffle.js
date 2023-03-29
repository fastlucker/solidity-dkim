const HDWalletProvider = require("@truffle/hdwallet-provider");
const PrivateKeyProvider = require("truffle-privatekey-provider");

const PRIVATE_KEY = 'N/A'
const ALCHEMY_KEY = 'N/A'

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    sepolia: {
      provider: () => new PrivateKeyProvider(PRIVATE_KEY, 'https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}'),
      gasPrice: 1e9,
      network_id: 11155111
    }
  },
  solc: {
    version: "0.5.8",
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  mocha: {
    reporter: "eth-gas-reporter"
  }
};
