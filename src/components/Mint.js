import { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { ethers } from 'ethers';

const Mint = ({ provider, nft, cost, setIsLoading, account }) => {
  const [isWaiting, setIsWaiting] = useState(false)
  const [isWhitelisted, setIsWhitelisted] = useState(false)
  const [numberOfNFTs, setNumberOfNFTs] = useState('')

  const setWhtList = async (e) => {
    e.preventDefault()
    
    const signer = await provider.getSigner()
    const transaction = await nft.connect(signer).addToWhtList(account)
    console.log(transaction)
  }

  const removeWhtList = async () => {
    
    const signer = await provider.getSigner()
    const transaction = await nft.connect(signer).removeFromWhtList(account)
    console.log(transaction)
  }

  const checkWhitelistStatus = async () => {
    const signer = await provider.getSigner()
    const isUserWhitelisted = await nft.connect(signer).whiteList(account)
    setIsWhitelisted(isUserWhitelisted)
    console.log(isUserWhitelisted)
    console.log(account)
  }

  const mintHandler = async (e) => {
    e.preventDefault()
    setIsWaiting(true)

    try {
      const signer = await provider.getSigner()

      const isValidInput = /^[1-9]\d*$/.test(numberOfNFTs);
      if (!isValidInput) {
        throw new Error('Please enter a valid positive integer for the number of NFTs to mint.')
      }

      const value = (cost * numberOfNFTs)
      
      const transaction = await nft.connect(signer).mint(numberOfNFTs, { value: value.toString() }) 
      await transaction.wait()
    } catch (error) {
      console.error(error)
      window.alert('User rejected or transaction reverted')
    }

    setIsLoading(true)
  }

  const handleInputChange = (e) => {
    // Allow only numeric characters
    const inputValue = e.target.value.replace(/\D/g, '');
    setNumberOfNFTs(inputValue);
  }

  useEffect(() => {
    checkWhitelistStatus()
  }, []);

  return(
    <Form onSubmit={mintHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>
      {isWaiting ? (
        <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
      ) : (
        <Form.Group className="input-group mb-3" style={{ width: '60%', margin: '50px auto' }}>
          <input 
            type="number" 
            className="form-control" 
            placeholder="Number of NFTs to mint" 
            aria-label="Number of NFTs to mint" 
            aria-describedby="button-addon2"
            value={numberOfNFTs}
            onChange={(e) => {setNumberOfNFTs(e.target.value); handleInputChange(e)}}
            pattern="[0-9]*"
            disabled={!isWhitelisted}
          />
          <Button variant="primary" type="submit" style={{ width: '25%' }} disabled={!isWhitelisted}>
            Mint
          </Button>
          {!isWhitelisted && <p>You are not whitelisted. Contact the owner to get whitelisted.</p>}
        </Form.Group>
      )}

    </Form>
  )
}

export default Mint;
