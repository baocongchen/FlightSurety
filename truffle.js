const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = 'oak reward iron else various olympic quiz region addict develop sun bridge';
const TEST_ORACLES_COUNT = 10;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 6721975
      // networkCheckTimeout: 10000,
      // provider: function() {
      //   return new HDWalletProvider(mnemonic, 'http://127.0.0.1:8545/', 0, TEST_ORACLES_COUNT);
      // },
      // network_id: '*',
      // gas: 6721975,
    },
  },
  compilers: {
    solc: {
      version: '^0.4.24',
    },
  },
};
