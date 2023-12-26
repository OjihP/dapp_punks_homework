import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

const Data = ({ provider, nft, account, maxSupply, totalSupply, cost, balance }) => {
  const [tokenIds, setTokenIds] = useState([])
  const [tokenURIs, setTokenURIs] = useState([])


  const fetchTokenData = async () => {
    try {
      const signer = await provider.getSigner()
      const ownerTokenIds = await nft.connect(signer).walletOfOwner(account)

      setTokenIds(ownerTokenIds)
      console.log(ownerTokenIds)

      const uris = ownerTokenIds.map(async (tokenId) => {
        const tokenURI = await nft.connect(signer).tokenURI(tokenId)
        return tokenURI
      })

      const tokenURIs = await Promise.all(uris)

      setTokenURIs(tokenURIs)
      console.log(uris)

    } catch (error) {
      console.error('Error fetching token data:', error)
    }
  }
  
  useEffect(() => {
    fetchTokenData()
   }, [nft, provider]);

  return(
    <div className='text-center'>
      <p><strong>Available to Mint:</strong> {maxSupply - totalSupply}</p>
      <p><strong>Cost to Mint:</strong> {ethers.utils.formatUnits(cost, 'ether')} ETH</p>
      <p><strong>You own:</strong> {balance.toString()}</p>
      <ul className="list-group list-group-horizontal">
          {tokenURIs.map((uri, index) => (
            <li key={index}>
              <img src={`https://gateway.pinata.cloud/${uri}`} 
                   alt=""
                   width="50px"
                   height="50px" 
              />
            </li>
          ))}
        </ul>
    </div>
    
  )
}

export default Data;
