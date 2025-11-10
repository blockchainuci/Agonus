// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
