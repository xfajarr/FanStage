// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ArtistIdentity.sol";
import "./CampaignContract.sol";
import "./interfaces/ICampaignContract.sol";

contract CampaignRegistry {
    error Unauthorized();

    ArtistIdentity public immutable artistIdentity;
    IERC20 public immutable IDRX;
    address public platformWallet;
    address public owner;

    uint256 public campaignCounter;
    uint256 public campaignCreationFee;

    mapping(uint256 => address) public campaignContracts;
    mapping(address => uint256[]) public artistCampaigns;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed artist,
        address campaignContract
    );

    event CampaignCreationFeeUpdated(uint256 newFee);
    event PlatformWalletUpdated(address newPlatformWallet);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyRegisteredArtist() {
        if (!artistIdentity.isRegisteredArtist(msg.sender))
            revert Unauthorized();
        _;
    }

    constructor(
        address _artistIdentity,
        address _idrxToken,
        address _platformWallet,
        uint256 _campaignCreationFee
    ) {
        require(
            _artistIdentity != address(0) &&
                _idrxToken != address(0) &&
                _platformWallet != address(0)
        );
        artistIdentity = ArtistIdentity(_artistIdentity);
        IDRX = IERC20(_idrxToken);
        platformWallet = _platformWallet;
        campaignCreationFee = _campaignCreationFee;
        owner = msg.sender;
    }

    function createCampaign(
        string memory ipfsHash,
        uint256 targetAmount,
        uint256 duration,
        uint256 funderSharePercent,
        ICampaignContract.Tier[] memory tiers,
        string memory artistTokenName,
        string memory campaignNftName
    ) external onlyRegisteredArtist returns (address campaignContract) {
        require(
            bytes(ipfsHash).length > 0 &&
                targetAmount > 0 &&
                duration > 0 &&
                duration <= 365 days
        );
        require(
            funderSharePercent <= 50 && tiers.length > 0 && tiers.length <= 10
        );
        require(
            bytes(artistTokenName).length > 0 &&
                bytes(campaignNftName).length > 0
        );
        require(platformWallet != address(0));

        for (uint256 i; i < tiers.length; i++) {
            require(
                tiers[i].threshold > 0 &&
                    tiers[i].profitPercent > 0 &&
                    tiers[i].profitPercent <= 100
            );
            require(bytes(tiers[i].name).length > 0);
            if (i > 0) {
                require(
                    tiers[i].threshold > tiers[i - 1].threshold &&
                        tiers[i].profitPercent >= tiers[i - 1].profitPercent
                );
            }
        }

        if (campaignCreationFee > 0) {
            require(
                IDRX.balanceOf(msg.sender) >= campaignCreationFee &&
                    IDRX.allowance(msg.sender, address(this)) >=
                    campaignCreationFee
            );
            require(
                IDRX.transferFrom(
                    msg.sender,
                    platformWallet,
                    campaignCreationFee
                )
            );
        }

        uint256 deadline = block.timestamp + duration;

        campaignContract = address(
            new CampaignContract(
                address(artistIdentity),
                address(IDRX),
                msg.sender,
                funderSharePercent,
                ipfsHash,
                targetAmount,
                deadline,
                platformWallet,
                tiers,
                artistTokenName,
                campaignNftName
            )
        );

        uint256 campaignId = campaignCounter;
        campaignContracts[campaignId] = campaignContract;
        artistCampaigns[msg.sender].push(campaignId);

        emit CampaignCreated(campaignId, msg.sender, campaignContract);

        campaignCounter++;

        return campaignContract;
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = IDRX.balanceOf(address(this));
        require(balance > 0);
        IDRX.transfer(platformWallet, balance);
    }

    function setCampaignCreationFee(uint256 _newFee) external onlyOwner {
        campaignCreationFee = _newFee;
        emit CampaignCreationFeeUpdated(_newFee);
    }
}
