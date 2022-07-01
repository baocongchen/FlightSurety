const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require("fs");

module.exports = async function (deployer, network, accounts) {
  const owner = accounts[0];
  const firstAirline = accounts[1];
  const fund = web3.utils.toWei("10", "ether");
  deployer
    .deploy(FlightSuretyData, firstAirline, { from: owner, value: fund })
    .then(() => {
      return deployer
        .deploy(FlightSuretyApp, FlightSuretyData.address, { from: owner })
        .then(() => {
          const config = {
            localhost: {
              url: "http://localhost:8545",
              dataAddress: FlightSuretyData.address,
              appAddress: FlightSuretyApp.address,
            },
          };
          fs.writeFileSync(
            __dirname + "/../src/dapp/config.json",
            JSON.stringify(config, null, "\t"),
            "utf-8"
          );
          fs.writeFileSync(
            __dirname + "/../src/server/config.json",
            JSON.stringify(config, null, "\t"),
            "utf-8"
          );
        });
    });
};
