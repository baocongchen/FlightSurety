pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false

    struct Airline {
        bool registered;
        bool fundPaid;
        mapping(address => bool) airlinesVoted;
    }

    mapping(address => Airline) private airlines;
    mapping(address => bool) private flights;
    mapping(address => uint256) private insurance;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event FundPaid(address indexed receiver, address indexed sender);

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor(address firstAirline) public payable {
        operational = true;
        contractOwner = msg.sender;
        airlines[firstAirline] = Airline({registered: true, fundPaid: true});
        address(this).transfer(msg.value);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     *    A getter function to obtain airline voting status
     */
    function getAirlineVotingStatus(address airline, address airlineToBeVoted)
        external
        view
        returns (bool)
    {
        return airlines[airline].airlinesVoted[airlineToBeVoted];
    }

    /**
     *    A getter function to obtain airline registration status
     */
    function getAirlineRegistrationStatus(address airline)
        external
        view
        returns (bool)
    {
        return airlines[airline].registered;
    }

    /**
     *    A getter function to obtain airline funding status
     */
    function getAirlineFundingStatus(address airline)
        external
        view
        returns (bool)
    {
        return airlines[airline].fundPaid;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address airline) external requireIsOperational {
        airlines[airline] = Airline({registered: true, fundPaid: false});
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy(uint256 value) external requireIsOperational {
        insurance[msg.sender] = value;
    }

    /**
     *  @dev Credits payouts to an insuree
     */
    function creditInsurees(address passenger) external requireIsOperational {
        insurance[passenger] = insurance[passenger].mul(3).div(2);
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay(address passenger) external payable requireIsOperational {
        msg.sender.transfer(insurance[passenger]);
        insurance[msg.sender] = 0;
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund(address airline) external {
        airlines[airline].fundPaid = true;
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    function() external payable {
        emit FundPaid(address(this), msg.sender);
    }
}
