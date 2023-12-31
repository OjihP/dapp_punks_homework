// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC721Enumerable.sol";
import "./Ownable.sol";

contract NFT is ERC721Enumerable, Ownable {
    using Strings for uint256;

    string public baseURI;
    string public baseExtension = ".png";
    uint256 public cost;
    uint256 public maxSupply;
    uint256 public allowMintingOn;
    bool public mintingPaused;

    mapping(address => bool) public whiteList;

    event Mint(uint256 amount, address minter);
    event Withdraw(uint256 amount, address owner);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _cost,
        uint256 _maxSupply,
        uint256 _allowMintingOn,
        string memory _baseURI
    ) ERC721(_name, _symbol) {
        cost = _cost;
        maxSupply = _maxSupply;
        allowMintingOn = _allowMintingOn;
        baseURI = _baseURI;
        mintingPaused = false;
        whiteList[owner()] = true;
    }

    modifier whenNotPaused() {
        require(!mintingPaused, "Minting is paused");
        _;
    }

    modifier onlyWhtListed() {
        require(whiteList[msg.sender] = true, "User is not whitelisted");
        _;
    }

    function mint(uint256 _mintAmount) public payable whenNotPaused onlyWhtListed {
        // Limits amount of tokens that can be mintined at a given amount
        require(_mintAmount <= 5, 'Exceeded minting limit');
        // Only allow minting after specified time
        require(block.timestamp >= allowMintingOn);
        // Must mint at least 1 token
        require(_mintAmount > 0, "Must mint at leeast 1 token");
        // Require enough payment
        require(msg.value >= cost * _mintAmount, "Invalid cost");

        uint256 supply = totalSupply();

        // Do not let them mint more tokens than available
        require(supply + _mintAmount <= maxSupply, "Invalid supply");

        // Create tokens
        for(uint256 i = 1; i <= _mintAmount; i++) {
            _safeMint(msg.sender, supply + i);
        }

        // Emit event
        emit Mint(_mintAmount, msg.sender);
    }

    // Return metadata IPFS url
    // EG: 'ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/1.json'
    // **will return: 'ipfs/QmQPEMsfd1tJnqYPbnTQCjoa8vczfsV1FmqZWgRdNQ7z3g/1.png'
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns(string memory)
    {
        require(_exists(_tokenId), 'token does not exist');
        return(string(abi.encodePacked(baseURI, _tokenId.toString(), baseExtension)));
    }

    function walletOfOwner(address _owner) public view returns(uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for(uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return (tokenIds);
    }

    // Owner functions

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;

        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success);

        emit Withdraw(balance, msg.sender);
    }

    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
    }

    function pauseMinting() public onlyOwner {
        mintingPaused = true;
    }

    function resumeMinting() public onlyOwner {
        mintingPaused = false;
    }

    function addToWhtList(address _user) public onlyOwner {
        whiteList[_user] = true;
    }

    function removeFromWhtList(address _user) public onlyOwner {
        whiteList[_user] = false;
    }
}
