import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";

export default class Contract {
  constructor(network, callback) {
    let config = Config[network];
    this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );
    this.initialize(callback);
    this.owner = null;
    this.airlines = [];
    this.passengers = [];
    this.gas = 6721975;
  }

  initialize(callback) {
    this.web3.eth.getAccounts((error, accts) => {
      this.owner = accts[0];

      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }

      callback();
    });
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  registerAirline(airline, registrar, callback) {
    const self = this;
    self.flightSuretyApp.methods
      .registerAirline(airline)
      .send({ from: registrar }, (error, result) => {
        if (error === null) {
          callback(error, `Airline ${airline} has been registered`);
        } else {
          callback(
            `Airline ${airline} has not been registered due to error ${error}`
          );
        }
      });
  }

  isAirlineRegistered(airline, callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isAirlineRegistered(airline)
      .call({ from: self.owner }, callback);
  }

  fundAirline(airline, callback) {
    const self = this;
    const amount = self.web3.utils.toWei("10", "ether");
    self.flightSuretyApp.methods
      .fundAirline()
      .send(
        { from: airline, value: amount, gas: self.gas },
        (error, result) => {
          callback(error, amount);
        }
      );
  }

  getAirlineFundingStatus(airline, callback) {
    const self = this;
    self.flightSuretyApp.methods
      .isAirlineFunded(airline)
      .call({ from: self.owner }, callback);
  }

  registerFlight(airline, flight, timestamp, callback) {
    const self = this;
    let payload = {
      airline: airline,
      flight: flight,
      timestamp: Math.floor(timestamp.getTime() / 1000),
    };
    if (!airline in this.airlines) {
      callback(
        `airline ${airline} is not valid. Valid airlines are ${this.airlines.join(
          "\r\n"
        )}`
      );
    }
    self.flightSuretyApp.methods
      .registerFlight(airline, flight, Math.floor(timestamp.getTime() / 1000))
      .send({ from: airline, gas: self.gas }, (error, result) => {
        if (error) {
          console.log(error, payload);
          callback(error, payload);
        } else {
          console.log(result);
          callback(
            error,
            `Airline ${airline} successfully registered flight ${flight} that will fly at ${timestamp}`
          );
        }
      });
  }

  buyInsurance(airline, flight, timestamp, passenger, value, callback) {
    const self = this;
    const amount = self.web3.utils.toWei(value, "ether");

    const payload = {
      airline: airline,
      flight: flight,
      timestamp: Math.floor(timestamp.getTime() / 1000),
      passenger: passenger,
      payment: amount,
    };

    self.flightSuretyApp.methods
      .buyInsurance(airline, flight, Math.floor(timestamp.getTime() / 1000))
      .send(
        { from: passenger, value: amount, gas: self.gas },
        (error, result) => {
          if (error) {
            console.log(error, payload);
            callback(error, payload);
          } else {
            console.log(result);
            callback(
              error,
              `Passenger ${passenger} successfully purchased flight insurance valued at ${amount}`
            );
          }
        }
      );
  }

  fetchFlightStatus(airline, flight, timestamp, callback) {
    const self = this;
    let payload = {
      airline: airline,
      flight: flight,
      timestamp: Math.floor(timestamp / 1000),
    };
    self.flightSuretyApp.methods
      .fetchFlightStatus(airline, flight, Math.floor(timestamp / 1000))
      .call({ from: self.owner, gas: self.gas }, (error, result) => {
        if (error) {
          console.log(error, payload);
          callback(error, payload);
        } else {
          console.log(result);
          callback(
            error,
            `Flight ${flight} is submitted to Oracles by ${self.owner}`
          );
        }
      });
  }

  getFlightRegistrationStatus(airline, flight, timestamp, callback) {
    const self = this;
    let payload = {
      airline: airline,
      flight: flight,
      timestamp: Math.floor(timestamp / 1000),
    };
    self.flightSuretyApp.methods
      .isFlightRegistered(airline, flight, Math.floor(timestamp / 1000))
      .call({ from: self.owner }, (error, result) => {
        if (error) {
          console.log(error, payload);
          callback(error, payload);
        } else {
          console.log(result);
          callback(error, `Flight ${flight} Registered: ${result}`);
        }
      });
  }

  getFlightStatus(airline, flight, timestamp, callback) {
    const self = this;
    let payload = {
      airline: airline,
      flight: flight,
      timestamp: Math.floor(timestamp / 1000),
    };
    self.flightSuretyApp.methods
      .getFlightStatus(airline, flight, Math.floor(timestamp / 1000))
      .call({ from: self.owner }, (error, result) => {
        if (error) {
          console.log(error, payload);
          callback(error, payload);
        } else {
          console.log(result);
          callback(error, `Flight Status of ${flight} from Oracles: ${result}`);
        }
      });
  }

  withdraw(passenger, value, callback) {
    let self = this;
    let amount = self.web3.utils.toWei(value, "ether");

    let payload = {
      passenger: passenger,
      amount: amount,
    };

    self.flightSuretyApp.methods
      .withdrawCredit()
      .send({ from: payload.passenger, gas: self.gas }, (error, result) => {
        callback(error, payload);
      });
  }
}
