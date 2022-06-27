import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


const config = Config['localhost'];
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
const flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
const STATUS_CODE = [0, 10, 20, 30, 40, 50];
/**
 * Oracle Registration
 */
const ORACLES_COUNT = 20;
const GAS = 6721975;

const REG_FEE = web3.utils.toWei('1', 'ether');
const oracleIndexes = {};
web3.eth.getAccounts().then(accounts => {
  for (let i = 11; i < ORACLES_COUNT; i++) {
    flightSuretyApp.methods.registerOracle().send({from: accounts[i], value: REG_FEE, gas: GAS}, (error, result) => {
      if (error) {
        throw new Error(error);
      } else {
        flightSuretyApp.methods.getMyIndexes().send({from: accounts[i]}, (error, index) => {
          if (error) {
            throw new Error(error);
          } else {
            oracleIndexes[accounts[i]] = index;
          }
        });
      }
    });
  }
});


/**
 * Oracle Request-Response
 */
flightSuretyApp.events.OracleRequest(function (error, event) {
    if (error) console.log(error);
    console.log(event);
    const index = event.returnValues.index;
    const airline = event.returnValues.airline;
    const flight = event.returnValues.flight;
    const timestamp = event.returnValues.flight;
    const statusCode = STATUS_CODE[Math.floor(Math.random() * STATUS_CODE.length)];
    for (const account in oracleIndexes) {
      if (oracleIndexes[account].includes(index)) {
        flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode).send({from: account}, (error, result) => {
          if (error) {
            throw new Error(error);
          } else {
            console.log(result);
            console.log(`Submitted oracle response for ${  account   } airline ${  airline  } flight ${  flight  } time ${   new Date(timestamp * 1000)  } with status code ${  statusCode}`);
          }
        });
      }
    }
  }
);

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!',
    });
});

export default app;


