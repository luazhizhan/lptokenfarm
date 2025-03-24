// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LPTokenFarm is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Info for each LP token farm
    struct PoolInfo {
        IERC20 lpToken; // Address of LP token contract
        uint256 allocPoint; // Proportion of rewards to allocate to this pool
        uint256 lastRewardBlock; // Last block number that rewards were distributed
        uint256 accRewardPerShare; // Accumulated rewards per share, times 1e18
        bool isActive; // Whether the pool is active
    }

    // Info of each user
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided
        uint256 rewardDebt; // Reward debt
    }

    // Reward token
    IERC20 public rewardToken;

    // Reward tokens per block (200 tokens with 18 decimals)
    uint256 public rewardPerBlock = 200 * 10 ** 18;

    // Info of each pool
    PoolInfo[] public poolInfo;

    // Info of each user that stakes LP tokens: poolId => userAddress => userInfo
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    // Total allocation points
    uint256 public totalAllocPoint = 0;

    // The block number when reward distribution starts
    uint256 public startBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );
    event PoolAdded(uint256 indexed pid, address lpToken, uint256 allocPoint);
    event RewardPerBlockUpdated(uint256 previousAmount, uint256 newAmount);

    constructor(IERC20 _rewardToken, uint256 _startBlock) Ownable(msg.sender) {
        rewardToken = _rewardToken;
        startBlock = _startBlock > block.number ? _startBlock : block.number;
    }

    // Number of LP token pools
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new LP token to the pool
    function addPool(IERC20 _lpToken, uint256 _allocPoint) external onlyOwner {
        // Make sure the LP token hasn't been added before
        for (uint256 i = 0; i < poolInfo.length; i++) {
            require(
                address(poolInfo[i].lpToken) != address(_lpToken),
                "LP token already added"
            );
        }

        // Update all pools before adding a new one
        massUpdatePools();

        uint256 lastRewardBlock = block.number > startBlock
            ? block.number
            : startBlock;
        totalAllocPoint += _allocPoint;

        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accRewardPerShare: 0,
                isActive: true
            })
        );

        emit PoolAdded(poolInfo.length - 1, address(_lpToken), _allocPoint);
    }

    // Update the allocation point of a pool
    function updatePoolAllocPoint(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }

        totalAllocPoint =
            totalAllocPoint -
            poolInfo[_pid].allocPoint +
            _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    // Update reward per block
    function updateRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        massUpdatePools();
        emit RewardPerBlockUpdated(rewardPerBlock, _rewardPerBlock);
        rewardPerBlock = _rewardPerBlock;
    }

    // Calculate pending rewards for a user in a specific pool
    function pendingRewards(
        uint256 _pid,
        address _user
    ) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];

        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));

        if (
            block.number > pool.lastRewardBlock &&
            lpSupply != 0 &&
            pool.isActive
        ) {
            uint256 blocksSinceLastReward = block.number - pool.lastRewardBlock;
            uint256 reward = (blocksSinceLastReward *
                rewardPerBlock *
                pool.allocPoint) / totalAllocPoint;
            accRewardPerShare += (reward * 1e18) / lpSupply;
        }

        return (user.amount * accRewardPerShare) / 1e18 - user.rewardDebt;
    }

    // Update reward variables for all pools
    function massUpdatePools() public {
        for (uint256 pid = 0; pid < poolInfo.length; pid++) {
            if (poolInfo[pid].isActive) {
                updatePool(pid);
            }
        }
    }

    // Update reward variables of the given pool
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];

        if (block.number <= pool.lastRewardBlock || !pool.isActive) {
            return;
        }

        uint256 lpSupply = pool.lpToken.balanceOf(address(this));

        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        uint256 blocksSinceLastReward = block.number - pool.lastRewardBlock;
        uint256 reward = (blocksSinceLastReward *
            rewardPerBlock *
            pool.allocPoint) / totalAllocPoint;

        // Ensure the contract has enough reward tokens
        require(
            rewardToken.balanceOf(address(this)) >= reward,
            "Not enough reward tokens"
        );

        pool.accRewardPerShare += (reward * 1e18) / lpSupply;
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to farm
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        require(pool.isActive, "Pool not active");
        updatePool(_pid);

        // Harvest rewards if user has deposits
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accRewardPerShare) /
                1e18 -
                user.rewardDebt;
            if (pending > 0) {
                safeRewardTransfer(msg.sender, pending);
            }
        }

        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
            user.amount += _amount;
        }

        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e18;
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from farm
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        require(user.amount >= _amount, "Withdraw: not enough LP tokens");

        updatePool(_pid);

        // Harvest rewards
        uint256 pending = (user.amount * pool.accRewardPerShare) /
            1e18 -
            user.rewardDebt;
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
        }

        if (_amount > 0) {
            user.amount -= _amount;
            pool.lpToken.safeTransfer(msg.sender, _amount);
        }

        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e18;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Claim rewards without withdrawing LP tokens
    function claimRewards(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        updatePool(_pid);

        uint256 pending = (user.amount * pool.accRewardPerShare) /
            1e18 -
            user.rewardDebt;
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
        }

        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e18;
    }

    // Emergency withdraw without caring about rewards
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        pool.lpToken.safeTransfer(msg.sender, user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);

        user.amount = 0;
        user.rewardDebt = 0;
    }

    // Safe reward token transfer function to prevent rounding errors
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBal = rewardToken.balanceOf(address(this));
        if (_amount > rewardBal) {
            rewardToken.transfer(_to, rewardBal);
        } else {
            rewardToken.transfer(_to, _amount);
        }
    }

    // Enable/disable a pool
    function setPoolActive(uint256 _pid, bool _isActive) external onlyOwner {
        updatePool(_pid);
        poolInfo[_pid].isActive = _isActive;
    }
}
