// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtistIdentity is ERC721URIStorage, Ownable {
    error MetadataURIEmpty();
    error NameEmpty();
    error ArtistNameExists();
    error ArtistAlreadyRegistered();

    uint256 private _nextTokenId;

    struct ArtistProfile {
        string name;
        uint256 createdAt;
    }

    mapping(address => uint256) private _artistToTokenId;
    mapping(uint256 => address) private _tokenIdToArtist;
    mapping(uint256 => ArtistProfile) private _artistProfiles;
    mapping(address => bool) private _hasRegistered;
    mapping(string => bool) public isArtistNameExist;

    event ArtistRegistered(
        address indexed artist,
        uint256 indexed tokenId,
        string name
    );

    event ProfileUpdated(
        address indexed artist,
        uint256 indexed tokenId,
        string metadataURI
    );

    event ArtistRevoked(
        address indexed artist,
        uint256 indexed tokenId,
        string name
    );

    modifier onlyArtist(address artist) {
        require(_hasRegistered[artist], "Not a registered artist");
        _;
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not the token owner");
        _;
    }

    constructor()
        ERC721("Fanetic Artist Identity", "FART")
        Ownable(msg.sender)
    {
        _nextTokenId = 1;
    }

    function registerArtist(
        string memory artistName,
        string memory metadataURI
    ) external returns (uint256) {
        if (_hasRegistered[msg.sender]) {
            revert ArtistAlreadyRegistered();
        }
        if (bytes(artistName).length == 0) {
            revert NameEmpty();
        }
        if (bytes(metadataURI).length == 0) {
            revert MetadataURIEmpty();
        }
        if (isArtistNameExist[artistName]) {
            revert ArtistNameExists();
        }

        uint256 tokenId = _nextTokenId++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);

        ArtistProfile storage profile = _artistProfiles[tokenId];
        profile.name = artistName;
        profile.createdAt = block.timestamp;

        _artistToTokenId[msg.sender] = tokenId;
        _tokenIdToArtist[tokenId] = msg.sender;
        _hasRegistered[msg.sender] = true;
        isArtistNameExist[artistName] = true;

        emit ArtistRegistered(msg.sender, tokenId, artistName);

        return tokenId;
    }

    function updateProfile(
        string memory _newName,
        string memory metadataURI
    ) external onlyArtist(msg.sender) {
        if (bytes(metadataURI).length == 0) {
            revert MetadataURIEmpty();
        }

        if (bytes(_newName).length == 0) {
            revert NameEmpty();
        }

        if (isArtistNameExist[_newName]) {
            revert ArtistNameExists();
        }

        uint256 tokenId = _artistToTokenId[msg.sender];

        string memory oldName = _artistProfiles[tokenId].name;
        delete isArtistNameExist[oldName];

        _artistProfiles[tokenId].name = _newName;
        isArtistNameExist[_newName] = true;

        _setTokenURI(tokenId, metadataURI);

        emit ProfileUpdated(msg.sender, tokenId, metadataURI);
    }

    function getArtistProfile(
        address artist
    ) external view onlyArtist(artist) returns (ArtistProfile memory) {
        uint256 tokenId = _artistToTokenId[artist];
        return _artistProfiles[tokenId];
    }

    function getArtistProfileByTokenId(
        uint256 tokenId
    ) external view returns (ArtistProfile memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _artistProfiles[tokenId];
    }

    function getArtistTokenId(address artist) external view returns (uint256) {
        require(_hasRegistered[artist], "Artist not registered");
        return _artistToTokenId[artist];
    }

    function getArtistByTokenId(
        uint256 tokenId
    ) external view returns (address) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenIdToArtist[tokenId];
    }

    function totalArtists() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        require(
            from == address(0) || to == address(0),
            "ArtistIdentity: Soul-bound token - transfer not allowed"
        );

        return super._update(to, tokenId, auth);
    }

    function revokeArtistIdentity(
        address artist
    ) external onlyOwner onlyArtist(artist) {
        uint256 tokenId = _artistToTokenId[artist];

        // FIX BUG: Clean up artist name from the registry
        string memory artistName = _artistProfiles[tokenId].name;
        delete isArtistNameExist[artistName];

        _burn(tokenId);

        delete _artistToTokenId[artist];
        delete _tokenIdToArtist[tokenId];
        delete _artistProfiles[tokenId];
        delete _hasRegistered[artist];

        emit ArtistRevoked(artist, tokenId, artistName);
    }

    function isRegisteredArtist(address artist) external view returns (bool) {
        return _hasRegistered[artist];
    }

    function getAllArtists() external view returns (address[] memory, ArtistProfile[] memory) {
        uint256 totalCount = _nextTokenId - 1;
        address[] memory artists = new address[](totalCount);
        ArtistProfile[] memory profiles = new ArtistProfile[](totalCount);

        for (uint256 i = 1; i <= totalCount; i++) {
            address artistAddress = _tokenIdToArtist[i];
            artists[i - 1] = artistAddress;
            profiles[i - 1] = _artistProfiles[i];
        }

        return (artists, profiles);
    }
}