"use client"

import { ethers } from "ethers";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3modal from "web3modal"

import { nftaddress, nftmarketaddress } from "../nftmarket.config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

interface NFTItem {
  price: string;
  tokenId: number;
  seller: string;
  owner: string;
  image: string;
  name: string;
  description: string;
}

export default function Home() {

  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {
    loadNFTs();
  }, [])
  
  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider);
    const data = await marketContract.fetchMarketItems();

    const items = await Promise.all(data.map(async (i: any) => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId);
      const meta = await axios.get(tokenUri);
      console.log(meta.data);
      
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: JSON.parse(Object.keys(meta.data)[0]).image,
        name: JSON.parse(Object.keys(meta.data)[0]).name,
        description: JSON.parse(Object.keys(meta.data)[0]).description,
      };
      return item;
    }))
    setNfts(items);
    setLoadingState('loaded');
  }

  async function buyNft(nft: any) {
    const web3modal = new Web3modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');

    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {
      value: price
    });

    await transaction.wait();

    loadNFTs();
  }

  if (loadingState === 'loaded' && !nfts.length) return (
    <h1 className="px-20 py-10 text-3xl" style={{fontFamily: "Poppins"}}>
      No items in the marketplace
    </h1>
  )

  console.log(nfts);
  

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px'}}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border-shadow bg-black rounded-xl overflow-hidden">
                <img src={nft.image} />
                <div className="p-4">
                  <p style={{height: '64px', fontFamily: "Poppins"}} className="text-2xl font-semibold">
                    {nft.name}
                  </p>
                  <div style={{height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400 italic">
                      {nft.description}
                    </p>
                  </div>
                  <div className="p-4 bg-black">
                    <p className="mb-4 text-white" style={{fontFamily: "Noto Sans", fontWeight: 200}}><span className="text-3xl">{nft.price}</span> ETH</p>
                    <button
                    className="w-full bg-blue-800 hover:bg-white hover:text-black transition-colors duration-300 text-white py-2 px-12 rounded"
                    style={{fontFamily: "Poppins", fontWeight: 500}}
                    onClick={() => buyNft(nft)}>
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
