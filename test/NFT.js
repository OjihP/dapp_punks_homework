const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('NFT', () => {
  const NAME = 'Dapp Punks'
  const SYMBOL = 'DP'
  const COST = ether(10)
  const MAX_SUPPLY = 25
  const BASE_URI = 'ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/'

  let nft,
      deployer,
      minter,
      notListed

  beforeEach(async () => {
    let accounts = await ethers.getSigners()
    deployer = accounts[0]
    minter = accounts[1]
    notListed = accounts[2]
  })

  describe('Deployment', () => {
    const ALLOW_MINTING_ON = (Date.now() + 120000).toString().slice(0, 10) // 2 minutes from now

    beforeEach(async () => {
      const NFT = await ethers.getContractFactory('NFT')
      nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)
    })

    it('has correct name', async () => {
      expect(await nft.name()).to.equal(NAME)
    })

    it('has correct symbol', async () => {
      expect(await nft.symbol()).to.equal(SYMBOL)
    })

    it('returns the cost to mint', async () => {
      expect(await nft.cost()).to.equal(COST)
    })

    it('returns the maximum total supply', async () => {
      expect(await nft.maxSupply()).to.equal(MAX_SUPPLY)
    })

    it('returns the allowed minting time', async () => {
      expect(await nft.allowMintingOn()).to.equal(ALLOW_MINTING_ON)
    })

    it('returns the base URI', async () => {
      expect(await nft.baseURI()).to.equal(BASE_URI)
    })

    it('returns the owner', async () => {
      expect(await nft.owner()).to.equal(deployer.address)
    })
  })

  describe('Minting', () => {
    let transaction, result

    describe('Success', async () => {

      const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10) // Now

      beforeEach(async () => {
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)
        await nft.addToWhtList(minter.address)

        transaction = await nft.connect(minter).mint(1, { value: COST })
        result = await transaction.wait()
      })

      it('returns the address of the minter', async () => {
        expect(await nft.ownerOf(1)).to.equal(minter.address)
      })

      it('returns total number of tokens the minter owns', async () => {
        // console.log(await nft.balanceOf(minter.address))
        expect(await nft.balanceOf(minter.address)).to.equal(1)
      })

      it('returns IPFS URI', async () => {
        // EG: 'ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/1.json'
        // Uncomment this line to see example
        // console.log(await nft.tokenURI(1))
        expect(await nft.tokenURI(1)).to.equal(`${BASE_URI}1.json`)
      })

      it('updates the total supply', async () => {
        expect(await nft.totalSupply()).to.equal(1)
      })

      it('updates the contract ether balance', async () => {
        expect(await ethers.provider.getBalance(nft.address)).to.equal(COST)
      })

      it('emits Mint event', async () => {
        await expect(transaction).to.emit(nft, 'Mint')
          .withArgs(1, minter.address)
      })
    })

    describe('Failure', async () => {

      it('rejects insufficient payment', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10) // Now
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)

        await expect(nft.connect(minter).mint(1, { value: ether(1) })).to.be.reverted
      })

      it('requires at least 1 NFT to be minted', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10) // Now
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)

        await expect(nft.connect(minter).mint(0, { value: COST })).to.be.reverted
      })

      it('rejects minting before allowed time', async () => {
        const ALLOW_MINTING_ON = new Date('May 26, 2030 18:00:00').getTime().toString().slice(0, 10)
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)

        await expect(nft.connect(minter).mint(1, { value: COST })).to.be.reverted
      })

      it('does not allow more NFTs to be minted than max amount', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10) // Now
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)

        await expect(nft.connect(minter).mint(100, { value: COST })).to.be.reverted
      })

      it('does not return URIs for invalid tokens', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10) // Now
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)
        nft.connect(minter).mint(1, { value: COST })
        await expect(nft.tokenURI('99')).to.be.reverted
      })

      it('limits NFT minting at a given amount', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10) // Now
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)

        await expect(nft.connect(minter).mint(6, { value: ether(60) })).to.be.reverted
      })
    })
  })

  describe('Displaying NFTs', () => {
    let transaction, result

    const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10) // Now

    beforeEach(async () => {
      const NFT = await ethers.getContractFactory('NFT')
      nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)
      await nft.addToWhtList(minter.address)

      // Mint 3 nfts
      transaction = await nft.connect(minter).mint(3, { value: ether(30) })
      result = await transaction.wait()
    })

    it('returns all the NFTs for a given owner', async () => {
      let tokenIds = await nft.walletOfOwner(minter.address)
      // Uncomment this line to see the return value
      // console.log("owner wallet", tokenIds)
      expect(tokenIds.length).to.equal(3)
      expect(tokenIds[0].toString()).to.equal('1')
      expect(tokenIds[1].toString()).to.equal('2')
      expect(tokenIds[2].toString()).to.equal('3')
    })
  })

  describe('Minting', () => {

    describe('Success', async () => {

      let transaction, result, balanceBefore

      const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10) // Now

      beforeEach(async () => {
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)
        await nft.addToWhtList(minter.address)

        transaction = await nft.connect(minter).mint(1, { value: COST })
        result = await transaction.wait()

        balanceBefore = await ethers.provider.getBalance(deployer.address)

        transaction = await nft.connect(deployer).withdraw()
        result = await transaction.wait()
      })

      it('deducts contract balance', async () => {
        expect(await ethers.provider.getBalance(nft.address)).to.equal(0)
      })

      it('sends funds to the owner', async () => {
        expect(await ethers.provider.getBalance(deployer.address)).to.be.greaterThan(balanceBefore)
      })

      it('emits a withdraw event', async () => {
        expect(transaction).to.emit(nft, 'Withdraw')
          .withArgs(COST, deployer.address)
      })

      it('should allow owner to pause minting', async () => {
        await nft.pauseMinting()
        const isPaused = await nft.mintingPaused()
        expect(isPaused).to.be.true
      })

      it('should allow the owner to resume minting', async () => {
        await nft.pauseMinting();
        await nft.resumeMinting();
        const isPaused = await nft.mintingPaused();
        expect(isPaused).to.be.false;
      })
    })

    describe('Failure', async () => {

      it('prevents non-owner from withdrawing', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10) // Now
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)
        nft.connect(minter).mint(1, { value: COST })

        await expect(nft.connect(minter).withdraw()).to.be.reverted
      })

      it('should not allow non-owners to pause minting', async () => {
        await expect(nft.connect(minter).pauseMinting()).to.be.reverted
      })

      it('should not allow non-owners to resume minting', async () => {
        await expect(nft.connect(minter).resumeMinting()).to.be.reverted
      })

      it('should not allow minting when paused', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10) // Now
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)

        await nft.pauseMinting()
        await expect(nft.connect(minter).mint(1, { value: COST })).to.be.revertedWith('Minting is paused')
      })
    
      it('should allow minting when not paused', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10) // Now
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI)
        await nft.addToWhtList(minter.address)

        await nft.connect(minter).mint(1, { value: COST })
        const balance = await nft.balanceOf(minter.address)
        expect(balance).to.equal(1)
      })
    })
  })

  describe('WhiteList', () => {

    describe('Success', async () => {
      it('should allow the owner to add users to the whitelist', async () => {
        await nft.addToWhtList(minter.address)
    
        const isWhitelisted = await nft.whiteList(minter.address)
        expect(isWhitelisted).to.be.true
      })

      it('should allow the owner to remove users from the whitelist', async () => {
        await nft.addToWhtList(minter.address)
        await nft.removeFromWhtList(minter.address)
    
        const isWhitelisted = await nft.whiteList(minter.address)
        expect(isWhitelisted).to.be.false
      })

      it('should allow whitelisted users to mint NFTs', async () => {
        await nft.addToWhtList(minter.address);
        await nft.connect(minter).mint(1, { value: COST })
    
        const ownerOfNFT = await nft.ownerOf(1)
        expect(ownerOfNFT).to.equal(minter.address)
      })
    })

    describe('Failure', async () => {
      it('should not allow non-owners to add users to the whitelist', async () => {
        await expect(nft.connect(notListed).addToWhtList(notListed.address)).to.be.reverted
      })

      it('should not allow non-owners to remove users from the whitelist', async () => {
        await expect(nft.connect(notListed).removeFromWhtList(notListed.address)).to.be.reverted
      })

      it('should not allow non-whitelisted users to mint NFTs', async () => {
        await expect(nft.connect(notListed).mint(1)).to.be.reverted
      })
    })
  })
})
