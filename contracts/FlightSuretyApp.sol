pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/
    FlightSuretyData flightSuretyData;

    // Flight status codees
    uint256 private constant CONSENSUS = 50; // 50% consensus
    uint256 private constant FUNDING = 10 ether;
    uint256 private constant STATUS_CODE_UNKNOWN = 0;
    uint256 private constant STATUS_CODE_ON_TIME = 10;
    uint256 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint256 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint256 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint256 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner; // Account used to deploy contract
    uint256 private registeredAirlines = 0;
    bool private operational;

    struct Flight {
        bool isRegistered;
        uint256 statusCode;
        address airline;
    }

    mapping(bytes32 => Flight) private flights;
    mapping(bytes32 => address) private flightIds;
    mapping(address => uint256) private votesEarned;
    /********************************************************************************************/
    /*                                       Events                                             */
    /********************************************************************************************/

    event AirlineRegisteredWithoutVotes(address indexed airline);
    event AirlineRegisteredWithVotes(address indexed airline, uint256 votes);
    event AirlineVoted(address indexed airlineVoting);
    event AirlineFunded(address indexed airline);
    event InsurancePurchased(
        address passenger,
        address airline,
        string flight,
        uint256 timestamp
    );
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
        // Modify to call data contract's status
        require(isOperational(), "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier fundedEnough() {
        require(
            msg.value >= FUNDING,
            "Not enough fund; funding of 1 ether is required"
        );
        _;
    }

    modifier requireAirlineRegistered() {
        require(
            flightSuretyData.getAirlineRegistrationStatus(msg.sender) == true,
            "Airline is not registered"
        );
        _;
    }

    modifier requireAirlinePaidFund() {
        require(
            flightSuretyData.getAirlineFundingStatus(msg.sender) == true,
            "Fund not paid"
        );
        _;
    }

    modifier requireHasNotVoted(address airlineToBeVoted) {
        require(
            flightSuretyData.getAirlineVotingStatus(
                msg.sender,
                airlineToBeVoted
            ) == false,
            "Cannot vote twice for a single airline"
        );
        _;
    }

    modifier requireHasNotFunded() {
        require(
            flightSuretyData.getAirlineFundingStatus(msg.sender) == false,
            "Cannot vote twice for a single airline"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
     * @dev Contract constructor
     *
     */
    constructor(address dataContract) public {
        operational = true;
        contractOwner = msg.sender;
        registeredAirlines += 1;
        flightSuretyData = FlightSuretyData(dataContract);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns (bool) {
        return flightSuretyData.isOperational(); // Modify to call data contract's status
    }

    function isAirlineRegistered(address airline)
        public
        view
        requireIsOperational
        returns (bool)
    {
        return flightSuretyData.getAirlineRegistrationStatus(airline);
    }

    function isAirlineFunded(address airline)
        public
        view
        requireIsOperational
        returns (bool)
    {
        return flightSuretyData.getAirlineFundingStatus(airline);
    }

    function isFlightRegistered(
        address airline,
        string flight,
        uint256 timestamp
    ) public view requireIsOperational returns (bool) {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        return flights[key].isRegistered;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *
     */
    function registerAirline(address airline)
        external
        requireIsOperational
        requireHasNotVoted(airline)
        returns (bool)
    {
        if (registeredAirlines < 4) {
            require(
                flightSuretyData.getAirlineFundingStatus(msg.sender),
                "Unable to register/vote for other airlines unless fund is paid"
            );
            flightSuretyData.registerAirline(airline);
            registeredAirlines += 1;
            emit AirlineRegisteredWithoutVotes(airline);
        } else {
            require(
                flightSuretyData.getAirlineFundingStatus(msg.sender),
                "Unable to register/vote for other airlines unless fund is paid"
            );
            votesEarned[airline] += 1; // vote to register airline
            emit AirlineVoted(airline);
            if (
                votesEarned[airline].mul(100).div(registeredAirlines) >=
                CONSENSUS
            ) {
                flightSuretyData.registerAirline(airline); // register airline after consensus reached
                emit AirlineRegisteredWithVotes(airline, votesEarned[airline]);
            }
            return false;
        }
        return true;
    }

    function fundAirline()
        external
        payable
        requireIsOperational
        requireAirlineRegistered
        fundedEnough
        requireHasNotFunded
        returns (bool)
    {
        flightSuretyData.fund(msg.sender);
        address(flightSuretyData).transfer(msg.value);
        emit AirlineFunded(msg.sender);
        return true;
    }

    /**
     * @dev Register a future flight for insuring.
     *
     */
    function registerFlight(
        address airline,
        string flight,
        uint256 timestamp
    )
        external
        requireIsOperational
        requireAirlineRegistered
        requireAirlinePaidFund
        returns (bool)
    {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        flights[key] = Flight({
            isRegistered: true,
            statusCode: 0,
            airline: airline
        });
        return true;
    }

    /**
     * @dev Called after oracle has updated flight status
     *
     */
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint256 statusCode
    ) internal requireIsOperational {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        if (
            statusCode == STATUS_CODE_LATE_AIRLINE ||
            statusCode == STATUS_CODE_LATE_TECHNICAL
        ) {
            flightSuretyData.creditInsurees(flightIds[key]); // send credits to all insurees of a flight when airline is at fault
        }
    }

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address airline,
        string flight,
        uint256 timestamp
    ) external view requireIsOperational returns (bool) {
        uint256 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        oracleResponses[key] = ResponseInfo({
            requester: msg.sender,
            isOpen: true
        });
        emit OracleRequest(index, airline, flight, timestamp);
        return oracleResponses[key].isOpen;
    }

    function getFlightStatus(
        address airline,
        string flight,
        uint256 timestamp
    ) public view requireIsOperational returns (uint256) {
        bytes32 key = getFlightKey(airline, flight, timestamp);
        return flights[key].statusCode;
    }

    function buyInsurance(
        address airline,
        string flight,
        uint256 timestamp
    ) external payable requireIsOperational {
        require(msg.value <= 1 ether, "Can only purchase up to 1 ether");
        require(isAirlineFunded(airline), "Airline is not funded");
        require(
            isFlightRegistered(airline, flight, timestamp),
            "Flight is not registered"
        );

        address(flightSuretyData).transfer(msg.value);
        flightSuretyData.buy(msg.value);
        emit InsurancePurchased(msg.sender, airline, flight, timestamp);
    }

    function withdrawCredit() external payable requireIsOperational {
        flightSuretyData.pay(msg.sender);
    }

    // region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint256 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint256[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint256 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint256 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint256 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        uint256 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    // Register an oracle with the contract
    function registerOracle() external payable requireIsOperational {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");
        // Duplicate registration is not allowed
        require(
            !oracles[msg.sender].isRegistered,
            "Unable to register! Oracle already exists"
        );
        uint256[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes() external view returns (uint256[3]) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint256 index,
        address airline,
        string flight,
        uint256 timestamp,
        uint256 statusCode
    ) external requireIsOperational {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);
        flights[key] = Flight({
            isRegistered: true,
            statusCode: statusCode,
            airline: airline
        });
        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function getFlightKey(
        address airline,
        string flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account) internal returns (uint256[3]) {
        uint256[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint256) {
        uint256 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint256 random = uint256(
            uint256(
                keccak256(
                    abi.encodePacked(blockhash(block.number - nonce++), account)
                )
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    // endregion
}

contract FlightSuretyData {
    function isOperational() public view returns (bool);

    function fund(address airline) external;

    function registerAirline(address airline) external;

    function creditInsurees(address passenger) external;

    function getAirlineRegistrationStatus(address airline)
        external
        view
        returns (bool);

    function getAirlineVotingStatus(address airline, address airlineToBeVoted)
        external
        view
        returns (bool);

    function getAirlineFundingStatus(address airline)
        external
        view
        returns (bool);

    function pay(address passenger) external payable;

    function buy(uint256 value) external;
}
