
var Test = require('../config/testConfig.js');
const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");

contract('Oracles', async (accounts) => {
  // Watch contract events
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;
  const TEST_ORACLES_COUNT = 20;
  let config;
  let flightSuretyApp;
  let flightSuretyData;
  const FUND = web3.utils.toWei("10", "ether");
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    flightSuretyData = await FlightSuretyData.new(config.firstAirline, {from: config.owner, value: FUND});
    flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address, {from: config.owner} );

  });


  it('can register oracles', async () => {

    // ARRANGE
    let fee = await flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {
      await flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      const result = await flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it('can request flight status', async () => {

    // ARRANGE
    const flight = 'ND1309'; // Course number
    const timestamp = Math.floor(Date.now() / 1000);
    await flightSuretyApp.registerFlight(config.firstAirline, flight, timestamp, {from: config.firstAirline});
    const status = await flightSuretyApp.isFlightRegistered(config.firstAirline, flight, timestamp);

    // Submit a request for oracles to get status information for a flight
    await flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {

      // Get oracle information
      let oracleIndexes = await flightSuretyApp.getMyIndexes.call({ from: accounts[a] });
      for(let idx=0; idx<3; idx++) {

        try {
          // Submit a response...it will only be accepted if there is an Index match
          await flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] });

        }
        catch(e) {
          // Enable this when debugging
           console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
        }

      }
    }

  });

 
});
