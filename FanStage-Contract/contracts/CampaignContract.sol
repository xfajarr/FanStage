// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ArtistIdentity.sol";
import "./ArtistToken.sol";
import "./interfaces/ICampaignContract.sol";

contract CampaignContract is
    ERC1155,
    Ownable,
    ReentrancyGuard,
    ICampaignContract
{
    error InvalidAmount();
    error InvalidStatus();
    error DeadlinePassed();
    error RefundNotAvailable();
    error InsufficientBalance();
    error TransferFailed();
    error InvalidAddress();

    uint256 public constant CAMPAIGN_NFT_ID = 0;
    uint256 public constant BRONZE_BADGE_ID = 2;
    uint256 public constant SILVER_BADGE_ID = 3;
    uint256 public constant GOLD_BADGE_ID = 4;
    uint256 public constant PLATINUM_BADGE_ID = 5;

    ArtistIdentity public immutable artistIdentity;
    IERC20 public immutable IDRX;
    ArtistToken public immutable artistToken;
    address public immutable platformWallet;

    CampaignData public campaignData;
    Tier[] public tiers;

    string public artistTokenName;
    string public campaignNftName;

    mapping(address => uint256) public totalFunded;

    mapping(address => mapping(uint256 => bool)) public hasTierBadge;

    address[] public funders;
    mapping(address => bool) private isFunder;

    mapping(address => uint256) public claimableRevenue;

    event CampaignCreated(
        address indexed artist,
        string artistTokenName,
        uint256 targetAmount,
        uint256 deadline
    );

    event TierBadgeMinted(
        address indexed funder,
        uint256 indexed tierId,
        string tierName
    );

    constructor(
        address _artistIdentity,
        address _idrx,
        address _artist,
        uint256 _funderSharePercent,
        string memory _ipfsHash,
        uint256 _targetAmount,
        uint256 _deadline,
        address _platformWallet,
        ICampaignContract.Tier[] memory _tiers,
        string memory _artistTokenName,
        string memory _campaignNftName
    ) ERC1155("") Ownable(_artist) {
        if (
            _artistIdentity == address(0) ||
            _idrx == address(0) ||
            _artist == address(0) ||
            _platformWallet == address(0)
        ) {
            revert InvalidAddress();
        }
        if (_targetAmount == 0) revert InvalidAmount();
        if (_deadline <= block.timestamp) revert InvalidAmount();
        if (_funderSharePercent > 50) revert InvalidAmount(); 
        if (_tiers.length == 0 || _tiers.length > 4) revert InvalidAmount();

        artistIdentity = ArtistIdentity(_artistIdentity);
        IDRX = IERC20(_idrx);
        platformWallet = _platformWallet;
        campaignNftName = _campaignNftName;

        artistToken = new ArtistToken(
            _artistTokenName,
            string(abi.encodePacked("FANT-", _artistTokenName)),
            address(this)
        );
        artistTokenName = _artistTokenName;

        campaignData = CampaignData({
            artist: _artist,
            funderSharePercent: _funderSharePercent,
            ipfsHash: _ipfsHash,
            targetAmount: _targetAmount,
            totalRaised: 0,
            deadline: _deadline,
            status: CampaignStatus.ONGOING,
            totalRevenue: 0,
            createdAt: block.timestamp
        });

        for (uint256 i = 0; i < _tiers.length; i++) {
            require(_tiers[i].threshold > 0, "Tier threshold must be > 0");
            require(_tiers[i].profitPercent > 0, "Tier profitPercent must be > 0");
            require(_tiers[i].profitPercent <= 100, "Tier profitPercent must be <= 100");
            if (i > 0) {
                require(
                    _tiers[i].threshold > _tiers[i - 1].threshold,
                    "Tiers must be in ascending order"
                );
                require(
                    _tiers[i].profitPercent >= _tiers[i - 1].profitPercent,
                    "Tier profitPercent must be in ascending order"
                );
            }
            tiers.push(_tiers[i]);
        }

        _mint(_artist, CAMPAIGN_NFT_ID, 1, "");

        emit CampaignCreated(
            _artist,
            _artistTokenName,
            _targetAmount,
            _deadline
        );
    }

    function fund(uint256 idrxAmount) external nonReentrant {
        if (idrxAmount == 0) revert InvalidAmount();
        if (IDRX.balanceOf(msg.sender) < idrxAmount)
            revert InsufficientBalance();
        if (campaignData.status != CampaignStatus.ONGOING)
            revert InvalidStatus();
        if (block.timestamp >= campaignData.deadline) revert DeadlinePassed();

        if (!IDRX.transferFrom(msg.sender, address(this), idrxAmount)) {
            revert TransferFailed();
        }

        artistToken.mint(msg.sender, idrxAmount);

        campaignData.totalRaised += idrxAmount;
        totalFunded[msg.sender] += idrxAmount;

        if (!isFunder[msg.sender]) {
            funders.push(msg.sender);
            isFunder[msg.sender] = true;
        }

        _checkAndMintTierBadges(msg.sender);

        if (campaignData.totalRaised >= campaignData.targetAmount) {
            campaignData.status = CampaignStatus.FUNDED;
            emit CampaignFunded(campaignData.totalRaised);
        }

        emit FundingReceived(msg.sender, idrxAmount, 0, 0);
    }

    function _checkAndMintTierBadges(address funder) internal {
        uint256 total = totalFunded[funder];

        for (uint256 i = 0; i < tiers.length; i++) {
            if (total >= tiers[i].threshold) {
                uint256 badgeId = BRONZE_BADGE_ID + i;
                
                if (!hasTierBadge[funder][badgeId]) {
                    _mint(funder, badgeId, 1, "");
                    hasTierBadge[funder][badgeId] = true;
                    emit TierBadgeMinted(funder, badgeId, tiers[i].name);
                }
            }
        }
    }

    function refund() external nonReentrant {
        if (campaignData.status == CampaignStatus.COMPLETED) {
            revert RefundNotAvailable();
        }

        uint256 tokenBalance = artistToken.balanceOf(msg.sender);
        if (tokenBalance == 0) revert InsufficientBalance();

        artistToken.burn(msg.sender, tokenBalance);

        for (uint256 i = 0; i < tiers.length; i++) {
            uint256 badgeId = BRONZE_BADGE_ID + i;
            if (hasTierBadge[msg.sender][badgeId]) {
                _burn(msg.sender, badgeId, 1);
                hasTierBadge[msg.sender][badgeId] = false;
            }
        }

        if (campaignData.status == CampaignStatus.ONGOING ||
            campaignData.status == CampaignStatus.FUNDED) {
            campaignData.totalRaised -= tokenBalance;

            if (campaignData.status == CampaignStatus.FUNDED &&
                campaignData.totalRaised < campaignData.targetAmount) {
                campaignData.status = CampaignStatus.ONGOING;
            }
        }

        if (!IDRX.transfer(msg.sender, tokenBalance)) {
            revert TransferFailed();
        }

        totalFunded[msg.sender] = 0;

        emit RefundClaimed(msg.sender, tokenBalance);
    }

    function submitRevenue(
        uint256 revenueAmount
    ) external onlyOwner nonReentrant {
        if (campaignData.status != CampaignStatus.FUNDED) {
            revert InvalidStatus();
        }
        if (revenueAmount == 0) revert InvalidAmount();
        if (!IDRX.transferFrom(msg.sender, address(this), revenueAmount)) {
            revert TransferFailed();
        }

        campaignData.totalRevenue = revenueAmount;
        campaignData.status = CampaignStatus.COMPLETED;

        uint256 funderPool = (revenueAmount * campaignData.funderSharePercent) / 100;
        uint256 artistShare = revenueAmount - funderPool;

        uint256 totalWeighted = 0;
        for (uint256 i = 0; i < funders.length; i++) {
            address funder = funders[i];
            uint256 fundedAmount = totalFunded[funder];
            uint256 tierPercent = _getTierProfitPercent(funder);
            totalWeighted += (fundedAmount * tierPercent);
        }

        if (totalWeighted > 0) {
            for (uint256 i = 0; i < funders.length; i++) {
                address funder = funders[i];
                uint256 fundedAmount = totalFunded[funder];
                uint256 tierPercent = _getTierProfitPercent(funder);
                uint256 weighted = fundedAmount * tierPercent;
                uint256 funderShare = (funderPool * weighted) / totalWeighted;
                claimableRevenue[funder] += funderShare;
            }
        }

        if (!IDRX.transfer(campaignData.artist, artistShare)) {
            revert TransferFailed();
        }

        emit RevenueSubmitted(revenueAmount);
        emit RevenueDistributed(campaignData.artist, artistShare, funderPool);
    }

    function _getTierProfitPercent(address funder) internal view returns (uint256) {
        for (uint256 i = tiers.length; i > 0; i--) {
            uint256 tierIndex = i - 1;
            uint256 badgeId = BRONZE_BADGE_ID + tierIndex;
            if (hasTierBadge[funder][badgeId]) {
                return tiers[tierIndex].profitPercent;
            }
        }
        return tiers[0].profitPercent;
    }

    function claimRevenue() external nonReentrant {
        uint256 claimable = claimableRevenue[msg.sender];
        if (claimable == 0) revert InsufficientBalance();

        claimableRevenue[msg.sender] = 0;

        if (!IDRX.transfer(msg.sender, claimable)) {
            revert TransferFailed();
        }

        emit RevenueClaimed(msg.sender, claimable);
    }


    function updateCampaignMetadata(
        string memory newIpfsHash
    ) external onlyOwner {
        if (campaignData.status != CampaignStatus.ONGOING) {
            revert InvalidStatus();
        }

        campaignData.ipfsHash = newIpfsHash;
        emit CampaignMetadataUpdated(newIpfsHash);
    }

    function extendDeadline(uint256 newDeadline) external onlyOwner {
        if (campaignData.status != CampaignStatus.ONGOING) {
            revert InvalidStatus();
        }
        require(newDeadline > campaignData.deadline, "Must extend deadline");
        require(newDeadline > block.timestamp, "Must be future date");

        campaignData.deadline = newDeadline;
        emit DeadlineExtended(newDeadline);
    }

    function getCampaignData()
        external
        view
        override
        returns (CampaignData memory)
    {
        return campaignData;
    }

    function getFunderInfo(
        address funder
    ) external view override returns (FunderInfo memory) {
        uint256 tokenBalance = artistToken.balanceOf(funder);
        uint8 highestTier = _getHighestTier(funder);

        return
            FunderInfo({
                totalFunded: totalFunded[funder],
                highestTier: highestTier,
                nftCount: tokenBalance > 0 ? 1 : 0,
                hasRefunded: tokenBalance == 0 && totalFunded[funder] > 0
            });
    }

    function _getHighestTier(address funder) internal view returns (uint8) {
        for (uint256 i = tiers.length; i > 0; i--) {
            uint256 tierIndex = i - 1;
            uint256 badgeId = BRONZE_BADGE_ID + tierIndex;
            if (hasTierBadge[funder][badgeId]) {
                return uint8(tierIndex);
            }
        }
        return 0;
    }

    function getTiers() external view override returns (Tier[] memory) {
        return tiers;
    }

    function getTotalFunders() external view override returns (uint256) {
        return funders.length;
    }

    function getArtistTokenBalance(
        address funder
    ) external view returns (uint256) {
        return artistToken.balanceOf(funder);
    }

    function getArtistTokenAddress() external view returns (address) {
        return address(artistToken);
    }

    function hasBadge(
        address funder,
        uint256 tierId
    ) external view returns (bool) {
        return hasTierBadge[funder][tierId];
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        if (tokenId == CAMPAIGN_NFT_ID) {
            return
                string(
                    abi.encodePacked(
                        "https://gateway.pinata.cloud/ipfs/",
                        campaignData.ipfsHash
                    )
                );
        } else {
            return
                string(
                    abi.encodePacked(
                        "https://gateway.pinata.cloud/ipfs/",
                        campaignData.ipfsHash,
                        "/tier-",
                        Strings.toString(tokenId),
                        ".json"
                    )
                );
        }
    }
}
