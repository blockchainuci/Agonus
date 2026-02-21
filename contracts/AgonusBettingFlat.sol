// Sources flattened with hardhat v3.0.10 https://hardhat.org

// SPDX-License-Identifier: MIT

// File npm/@openzeppelin/contracts@5.4.0/utils/Context.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File npm/@openzeppelin/contracts@5.4.0/access/Ownable.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File npm/@openzeppelin/contracts@5.4.0/utils/ReentrancyGuard.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// File contracts/AgonusBetting.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;


/**
 * @title SimpleBetting
 * @notice Simple parimutuel betting for tournaments
 */
contract AgonusBetting is Ownable, ReentrancyGuard {
    
    // ============ Constants ============
    
    uint256 public constant PLATFORM_FEE_BP = 500; // 5%
    uint256 public constant BP_DIVISOR = 10000;
    uint256 public constant MIN_BET = 0.001 ether;
    
    // ============ State Variables ============
    
    address public platformWallet;
    uint256 public nextTournamentId;
    
    // ============ Structs ============
    
    struct Tournament {
        bool isActive;
        bool isSettled;
        uint256 totalPool;
        uint256 winningAgentId;
        uint256 agentCount;
    }
    
    // tournamentId => Tournament
    mapping(uint256 => Tournament) public tournaments;
    
    // tournamentId => agentId => totalBets
    mapping(uint256 => mapping(uint256 => uint256)) public agentPools;
    
    // tournamentId => user => agentId => amount
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public userBets;
    
    // tournamentId => user => hasClaimed
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    
    // ============ Events ============
    
    event TournamentCreated(uint256 indexed tournamentId, uint256 agentCount);
    event BetPlaced(address indexed user, uint256 indexed tournamentId, uint256 agentId, uint256 amount);
    event BettingClosed(uint256 indexed tournamentId);
    event TournamentSettled(uint256 indexed tournamentId, uint256 winningAgentId);
    event TournamentCancelled(uint256 indexed tournamentId);
    event WinningsClaimed(address indexed user, uint256 indexed tournamentId, uint256 amount);
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        platformWallet = msg.sender;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Create a new tournament
     * @param agentCount Number of agents (e.g., 3 means agents 1, 2, 3)
     */
    function createTournament(uint256 agentCount) external onlyOwner returns (uint256) {
        require(agentCount >= 2 && agentCount <= 100, "Invalid agent count");
        
        uint256 tournamentId = nextTournamentId++;
        
        tournaments[tournamentId] = Tournament({
            isActive: true,
            isSettled: false,
            totalPool: 0,
            winningAgentId: 0,
            agentCount: agentCount
        });
        
        emit TournamentCreated(tournamentId, agentCount);
        return tournamentId;
    }
    
    /**
     * @notice Close betting for a tournament
     */
    function closeBetting(uint256 tournamentId) external onlyOwner {
        Tournament storage t = tournaments[tournamentId];
        require(t.agentCount > 0, "Tournament does not exist");
        require(t.isActive, "Already closed");
        
        t.isActive = false;
        emit BettingClosed(tournamentId);
    }
    
    /**
     * @notice Settle tournament with a winner
     */
    function settleTournament(uint256 tournamentId, uint256 winningAgentId) 
        external 
        onlyOwner 
        nonReentrant 
    {
        Tournament storage t = tournaments[tournamentId];
        require(t.agentCount > 0, "Tournament does not exist");
        require(!t.isActive, "Betting still active");
        require(!t.isSettled, "Already settled");
        require(t.totalPool > 0, "No bets placed");
        require(winningAgentId > 0 && winningAgentId <= t.agentCount, "Invalid agent ID");
        
        t.isSettled = true;
        t.winningAgentId = winningAgentId;
        
        // Transfer platform fee
        uint256 platformFee = (t.totalPool * PLATFORM_FEE_BP) / BP_DIVISOR;
        (bool success, ) = platformWallet.call{value: platformFee}("");
        require(success, "Fee transfer failed");
        
        emit TournamentSettled(tournamentId, winningAgentId);
    }
    
    /**
     * @notice Cancel tournament (enables refunds)
     */
    function cancelTournament(uint256 tournamentId) external onlyOwner {
        Tournament storage t = tournaments[tournamentId];
        require(t.agentCount > 0, "Tournament does not exist");
        require(!t.isSettled, "Already settled");
        
        t.isActive = false;
        t.isSettled = true;
        // winningAgentId stays 0 to indicate cancellation
        
        emit TournamentCancelled(tournamentId);
    }
    
    /**
     * @notice Update platform wallet
     */
    function setPlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid address");
        platformWallet = newWallet;
    }
    
    // ============ User Functions ============
    
    /**
     * @notice Place a bet on an agent
     */
    function placeBet(uint256 tournamentId, uint256 agentId) 
        external 
        payable 
        nonReentrant 
    {
        Tournament storage t = tournaments[tournamentId];
        require(t.agentCount > 0, "Tournament does not exist");
        require(t.isActive, "Tournament not active");
        require(msg.value >= MIN_BET, "Bet below minimum");
        require(agentId > 0 && agentId <= t.agentCount, "Invalid agent ID");
        
        // Update pools
        t.totalPool += msg.value;
        agentPools[tournamentId][agentId] += msg.value;
        userBets[tournamentId][msg.sender][agentId] += msg.value;
        
        emit BetPlaced(msg.sender, tournamentId, agentId, msg.value);
    }
    
    /**
     * @notice Claim winnings or refund
     */
    function claimWinnings(uint256 tournamentId) external nonReentrant {
        Tournament storage t = tournaments[tournamentId];
        require(t.agentCount > 0, "Tournament does not exist");
        require(t.isSettled, "Tournament not settled");
        require(!hasClaimed[tournamentId][msg.sender], "Already claimed");
        
        uint256 payout = 0;
        
        // Cancelled tournament - refund all bets
        if (t.winningAgentId == 0) {
            for (uint256 agentId = 1; agentId <= t.agentCount; agentId++) {
                payout += userBets[tournamentId][msg.sender][agentId];
            }
        } 
        // Normal settlement - pay winners
        else {
            uint256 userBetOnWinner = userBets[tournamentId][msg.sender][t.winningAgentId];
            require(userBetOnWinner > 0, "No winning bets");
            
            uint256 winningPool = agentPools[tournamentId][t.winningAgentId];
            uint256 totalWinnerPayout = t.totalPool - ((t.totalPool * PLATFORM_FEE_BP) / BP_DIVISOR);
            
            // payout = (userBet / winningPool) * totalWinnerPayout
            payout = (userBetOnWinner * totalWinnerPayout) / winningPool;
        }
        
        require(payout > 0, "No winnings to claim");
        
        hasClaimed[tournamentId][msg.sender] = true;
        
        (bool success, ) = msg.sender.call{value: payout}("");
        require(success, "Transfer failed");
        
        emit WinningsClaimed(msg.sender, tournamentId, payout);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get current odds for an agent (in basis points)
     */
    function getAgentOdds(uint256 tournamentId, uint256 agentId) 
        external 
        view 
        returns (uint256) 
    {
        Tournament storage t = tournaments[tournamentId];
        require(agentId > 0 && agentId <= t.agentCount, "Invalid agent ID");
        
        if (t.totalPool == 0) return BP_DIVISOR; // 1:1 default
        
        uint256 pool = agentPools[tournamentId][agentId];
        if (pool == 0) return 0; // No bets = no odds
        
        uint256 winnerPool = (t.totalPool * (BP_DIVISOR - PLATFORM_FEE_BP)) / BP_DIVISOR;
        return (winnerPool * BP_DIVISOR) / pool;
    }
    
    /**
     * @notice Get user's total bet on a specific agent
     */
    function getUserBetOnAgent(uint256 tournamentId, address user, uint256 agentId) 
        external 
        view 
        returns (uint256) 
    {
        return userBets[tournamentId][user][agentId];
    }
    
    /**
     * @notice Calculate potential payout for user
     */
    function calculatePayout(uint256 tournamentId, address user) 
        external 
        view 
        returns (uint256) 
    {
        Tournament storage t = tournaments[tournamentId];
        if (!t.isSettled) return 0;
        if (hasClaimed[tournamentId][user]) return 0;
        
        // Cancelled - refund
        if (t.winningAgentId == 0) {
            uint256 total = 0;
            for (uint256 agentId = 1; agentId <= t.agentCount; agentId++) {
                total += userBets[tournamentId][user][agentId];
            }
            return total;
        }
        
        // Winner payout
        uint256 userBetOnWinner = userBets[tournamentId][user][t.winningAgentId];
        if (userBetOnWinner == 0) return 0;
        
        uint256 winningPool = agentPools[tournamentId][t.winningAgentId];
        uint256 totalWinnerPayout = t.totalPool - ((t.totalPool * PLATFORM_FEE_BP) / BP_DIVISOR);
        
        return (userBetOnWinner * totalWinnerPayout) / winningPool;
    }
    
    // ============ Safety ============
    
    receive() external payable {
        revert("Use placeBet function");
    }
}

