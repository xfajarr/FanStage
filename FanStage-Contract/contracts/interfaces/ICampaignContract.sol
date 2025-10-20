// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface ICampaignContract {
    enum CampaignStatus {
        ONGOING,      // Accepting funding
        FUNDED,       // Target reached, waiting for revenue
        COMPLETED,    // Revenue distributed
        FAILED        // Deadline passed, target not met
    }

    struct Tier {
        string name;              // "Bronze", "Silver", "Gold", "Platinum"
        uint256 threshold;        // Minimum funding amount (artist configurable)
        uint256 profitPercent;    // Profit weight percentage (e.g., 1, 2, 3)
        string benefits;          // IPFS hash with tier benefits description
    }

    struct CampaignData {
        address artist;              // The campaign creator
        uint256 funderSharePercent;  // % of revenue funders receive (e.g., 30 = funders get 30%)
        string ipfsHash;             // Campaign metadata (description, roadmap, etc.)
        uint256 targetAmount;        // Funding goal in IDRX
        uint256 totalRaised;         // Current amount raised
        uint256 deadline;            // Campaign end timestamp
        CampaignStatus status;       // Current campaign status
        uint256 totalRevenue;        // Revenue sent by artist after campaign success
        uint256 createdAt;           // Timestamp when campaign was created
    }

    struct FunderInfo {
        uint256 totalFunded;         
        uint8 highestTier;           
        uint256 nftCount;            
        bool hasRefunded;            
    }

    // Events
    event FundingReceived(
        address indexed funder,
        uint256 amount,
        uint8 tier,
        uint256 tokenId
    );

    event CampaignFunded(uint256 totalRaised);

    event RevenueSubmitted(uint256 revenueAmount);

    event RevenueDistributed(
        address indexed artist,
        uint256 artistShare,
        uint256 funderPoolAmount
    );

    event RevenueClaimed(
        address indexed funder,
        uint256 amount
    );

    event RefundClaimed(
        address indexed funder,
        uint256 amount
    );

    event CampaignMetadataUpdated(string newIpfsHash);

    event DeadlineExtended(uint256 newDeadline);

    function getCampaignData() external view returns (CampaignData memory);

    function getFunderInfo(address funder) external view returns (FunderInfo memory);

    function getTiers() external view returns (Tier[] memory);

    function getTotalFunders() external view returns (uint256);
}
