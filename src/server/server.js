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
const oracles = [];
web3.eth.getAccounts().then((accounts, error) => {
  for (let i = 10; i < ORACLES_COUNT; i++) {
    oracles.push(accounts[i]);
    flightSuretyApp.methods.registerOracle().send({from: accounts[i], value: REG_FEE, gas: GAS}).then(() => {
      flightSuretyApp.methods.getMyIndexes().call({from: accounts[i]}, (result, error) => {
        if (error) {
          throw new Error(error);
        } else {
          console.log(result);
        }
      });
    });
  }
});


/**
 * Oracle Request-Response
 */
flightSuretyApp.events.OracleRequest({
  fromBlock: 'latest'
}, function (error, event) {
  if (error) console.log(error);
  console.log(event);
  const index = event.returnValues.index;
  const airline = event.returnValues.airline;
  const flight = event.returnValues.flight;
  const timestamp = event.returnValues.timestamp;
  const statusCode = STATUS_CODE[Math.floor(Math.random() * STATUS_CODE.length)];
  for (let i=0; i<oracles.length; i++) {
    flightSuretyApp.methods.getMyIndexes().call({from: oracles[i]}).then((indices, err) => {
      if (err) throw new Error(err);
      for (let j=0; j<indices.length; j++) {
        if (indices[j] == index) {
          flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode).send({from: oracles[i], gas: GAS}).then((res, err) => {
            if (err) throw new Error(err);
          })
          break;
        }
      }
    });
  }
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!',
    });
});

export default app;


