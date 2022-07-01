import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", () => {
    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error, result);
      display("Operational Status", "Check if contract is operational", [
        { label: "Operational Status", error: error, value: result },
      ]);
    });

    // User-submitted transaction
    DOM.elid("register-airline").addEventListener("click", () => {
      const airline = DOM.elid("registered-airline").value;
      const from = DOM.elid("registering-airline").value;

      contract.registerAirline(airline, from, (error, result) => {
        console.log(error, result);
        display("Airlines", "Register airlines", [
          { label: "Register Airline", error: error, value: result },
        ]);
      });
    });

    DOM.elid("fetch-registration-status").addEventListener("click", () => {
      const airline = DOM.elid("registration-status").value;

      contract.isAirlineRegistered(airline, (error, result) => {
        console.log(error, result);
        display("Airlines", "Get Status Code", [
          {
            label: "Registration Status",
            error: error,
            value: `Airline: ${airline}, Status: ${result}`,
          },
        ]);
      });
    });

    DOM.elid("fund-airline").addEventListener("click", () => {
      const airline = DOM.elid("airline-to-be-funded").value;

      contract.fundAirline(airline, (error, result) => {
        console.log(error, result);
        display("Airlines", "Fund Airline", [
          { label: "Funding Result", error: error, value: result },
        ]);
      });
    });

    DOM.elid("fetch-funding-status").addEventListener("click", () => {
      const airline = DOM.elid("funded-airline").value;

      contract.getAirlineFundingStatus(airline, (error, result) => {
        console.log(error, result);
        display("Airlines", "Get Status Code", [
          {
            label: "Funding Status",
            error: error,
            value: `Airline: ${airline}, Status: ${result}`,
          },
        ]);
      });
    });

    DOM.elid("register-flight").addEventListener("click", () => {
      const airline = DOM.elid("flight-airline-address").value;
      const flight = DOM.elid("flight-number").value;
      const timestamp = new Date(DOM.elid("flight-timestamp").value);

      contract.registerFlight(airline, flight, timestamp, (error, result) => {
        console.log(error, result);
        display("Flight", "Register flight", [
          { label: "Register Flight", error: error, value: result },
        ]);
      });
    });

    DOM.elid("buy-insurance").addEventListener("click", () => {
      const passenger = DOM.elid("passenger-address").value;
      const amount = DOM.elid("insurance-purchase-amount").value;

      const airline = DOM.elid("flight-insurance-airline-address").value;
      const flight = DOM.elid("insurance-flight-id").value;
      const timestamp = new Date(DOM.elid("insurance-flight-timestamp").value);

      contract.buyInsurance(
        airline,
        flight,
        timestamp,
        passenger,
        amount,
        (error, result) => {
          console.log(error, result);
          display("Insurance", "Buy Insurance", [
            { label: "Buy Insurance", error: error, value: result },
          ]);
        }
      );
    });

    // User-submitted transaction
    DOM.elid("submit-flight").addEventListener("click", () => {
      const flight = DOM.elid("submission-flight-id").value;
      const airline = DOM.elid("submission-airline-address").value;
      const timestamp = new Date(DOM.elid("submission-flight-timestamp").value);
      // Write transaction
      contract.fetchFlightStatus(
        airline,
        flight,
        timestamp,
        (error, result) => {
          display("Oracles", "Trigger oracles", [
            {
              label: "Flight Submitted to Oracles",
              error: error,
              value: result,
            },
          ]);
        }
      );
    });

    DOM.elid("get-flight-reg-status").addEventListener("click", () => {
      const flight = DOM.elid("reg-flight-id").value;
      const airline = DOM.elid("reg-airline-address").value;
      const timestamp = new Date(DOM.elid("reg-flight-timestamp").value);
      // Write transaction
      contract.getFlightRegistrationStatus(
        airline,
        flight,
        timestamp,
        (error, result) => {
          display("Flight", "Get Flight Registration", [
            { label: "Is Registered: ", error: error, value: result },
          ]);
        }
      );
    });

    DOM.elid("get-flight-status").addEventListener("click", () => {
      const airline = DOM.elid("status-airline-address").value;
      const flight = DOM.elid("status-flight-id").value;
      const timestamp = new Date(DOM.elid("status-flight-timestamp").value);

      contract.getFlightStatus(airline, flight, timestamp, (error, result) => {
        console.log(error, result);
        display("Flight", "Get Status Code", [
          { label: "Flight Status Code", error: error, value: result },
        ]);
      });
    });

    DOM.elid("withdraw-credits").addEventListener("click", () => {
      let passenger = DOM.elid("passenger").value;
      let amount = DOM.elid("insurance-amount").value;

      contract.withdrawCreditedAmount(passenger, amount, (error, result) => {
        console.log(error, result);
        display("Credits", "Withdraw Credits", [
          {
            label: "Withdraw Credits",
            error: error,
            value: result.passenger + " " + result.amount,
          },
        ]);
      });
    });
  });
})();

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-8 field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    section.appendChild(row);
  });
  displayDiv.append(section);
}
