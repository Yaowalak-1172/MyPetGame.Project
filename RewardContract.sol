// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardContract is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable petToken;

    uint256 public constant WELCOME_REWARD = 10 * 10**18;

    mapping(uint256 => uint256) public missionRewards;

    mapping(address => mapping(uint256 => bool))
        public hasCompletedMission;

    event RewardClaimed(
        address indexed player,
        uint256 indexed missionId,
        uint256 amount
    );

    constructor(address _petTokenAddress) Ownable(msg.sender) {
        require(
            _petTokenAddress != address(0),
            "Invalid PET token address"
        );

        petToken = IERC20(_petTokenAddress);

        missionRewards[1] = 10 * 10**18;
        missionRewards[2] = 10 * 10**18;
        missionRewards[3] = 10 * 10**18;
        missionRewards[4] = 15 * 10**18;
        missionRewards[5] = 20 * 10**18;
    }

    function claimMissionReward(uint256 missionId) external {
        require(
            missionId <= 5,
            "Invalid mission ID"
        );

        require(
            !hasCompletedMission[msg.sender][missionId],
            "Mission already claimed"
        );

        uint256 rewardAmount;

        if (missionId == 0) {
            rewardAmount = WELCOME_REWARD;
        } else {
            rewardAmount = missionRewards[missionId];
        }

        require(
            petToken.balanceOf(address(this)) >= rewardAmount,
            "Insufficient reward pool"
        );

        hasCompletedMission[msg.sender][missionId] = true;

        petToken.safeTransfer(
            msg.sender,
            rewardAmount
        );

        emit RewardClaimed(
            msg.sender,
            missionId,
            rewardAmount
        );
    }

    function getReserveBalance()
        external
        view
        returns (uint256)
    {
        return petToken.balanceOf(address(this));
    }

    function canClaimReward(
        address player,
        uint256 missionId
    )
        external
        view
        returns (bool)
    {
        if (missionId > 5) {
            return false;
        }

        if (hasCompletedMission[player][missionId]) {
            return false;
        }

        uint256 rewardAmount = missionId == 0
            ? WELCOME_REWARD
            : missionRewards[missionId];

        return petToken.balanceOf(address(this)) >= rewardAmount;
    }
}