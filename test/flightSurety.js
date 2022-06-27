
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");

contract('Flight Surety Tests', async (accounts) => {

    let config;
    let flightSuretyApp;
    let flightSuretyData;
    const FUND = web3.utils.toWei("10", "ether");
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        // register accounts[1] and set accounts[0] as owner of contract
        flightSuretyData = await FlightSuretyData.new(config.firstAirline, {from: config.owner, value: FUND});
        flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address, {from: config.owner} );
    });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        const status = await flightSuretyData.isOperational.call();
        assert.equal(status, true, 'Incorrect initial operating status value');

    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try
        {
            await flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try
        {
            await flightSuretyData.setOperatingStatus(false);
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

        await flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        try
        {
            await flightSurety.setTestingMode(true);
        }
        catch(e) {
            reverted = true;
        }
        assert.equal(reverted, true, 'Access not blocked for requireIsOperational');

        // Set it back for other tests to work
        await flightSuretyData.setOperatingStatus(true);

    });


    it('first airline can register second airline', async () => {
        const secondAirline = accounts[2];
        await flightSuretyApp.registerAirline(secondAirline, {from: config.firstAirline});
        const result = await flightSuretyApp.isAirlineRegistered(secondAirline);
        assert.equal(result, true, 'Second Airline failed to register');
    });

    it('second airline can fund', async () => {
        const secondAirline = accounts[2];
        await flightSuretyApp.fundAirline({from: secondAirline, value: FUND});
        const result = await flightSuretyApp.isAirlineFunded(secondAirline);
        assert.equal(result, true, 'Second Airline failed to fund');
    });

    it('(airline) cannot register another Airline if it is not funded', async () => {

        // ARRANGE
        const newAirline = accounts[3];
        const anotherNewAirline = accounts[4];

        // ACT
        try {
            await flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
            await flightSuretyApp.registerAirline(anotherNewAirline, {from: newAirline}); // newAirline cannot register anotherNewAirline since it's not funded
        }
        catch(e) {

        }
        const result = await flightSuretyApp.isAirlineRegistered(anotherNewAirline);

        // ASSERT
        assert.equal(result, false, "Airline should not be able to register/vote for another airline if it hasn't provided funding");

    });

    it('(airline) can register another Airline if it is funded', async () => {

        // ARRANGE
        const thirdAirline = accounts[3];
        const fourthAirline = accounts[4];
        let test;
        // ACT
        try {

            await flightSuretyApp.fundAirline({from: thirdAirline, value: FUND});
            await flightSuretyApp.registerAirline(fourthAirline, {from: thirdAirline});
        }
        catch(e) {

        }
        const result = await flightSuretyApp.isAirlineRegistered(fourthAirline);

        // ASSERT
        assert.equal(result , true, 'Airline should be able to register/vote for another airline if it has provided fund');

    });

    it('5th airline is not registered if it has less than 50% Concensus', async () => {
        // ARRANGE
        // 4 airlines already registered including contract owner, two through contract initialization process, two through the test cases above
        // register 1 more for testing purposes
        const fourthAirline = accounts[4];
        const fifthAirline = accounts[5];
        // fund the fourth airline so that it's ready to vote for other airlines
        await flightSuretyApp.fundAirline({from: fourthAirline, value: FUND});

        // ACT

        await flightSuretyApp.registerAirline(fifthAirline, {
            from: fourthAirline, // fourthAirline votes for fifth airline
        });

        const result = await flightSuretyApp.isAirlineRegistered(fifthAirline);

        // ASSERT
        assert.equal(
            result,
            false,
            '50% consensus needs to be achieved in order for 5th airline to be registered.',
        );
    });

    it('With 75% consensus (>= 50%), the 5th airline can be registered!', async () => {
        const firstAirline = accounts[1];
        const secondAirline = accounts[2];
        const fifthAirline = accounts[5];
        await flightSuretyApp.registerAirline(fifthAirline, {
            from: firstAirline,
        });
        await flightSuretyApp.registerAirline(fifthAirline, {
            from: secondAirline,
        });
        const result = await flightSuretyApp.isAirlineRegistered(fifthAirline);
        assert.equal(
            result,
            true,
            '50% consensus needs to be achieved in order for 5th airline to be registered.',
        );
    });
});
