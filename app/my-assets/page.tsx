"use client"

import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftaddress, nftmarketaddress } from "@/nftmarket.config";

import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

interface NFTItem {
    price: string;
    tokenId: number;
    seller: string;
    owner: string;
    image: string;
  }

export default function MyAssets() {
    const [nfts, setNfts] = useState<NFTItem[]>([]);
    const [loadingState, setLoadingState] = useState('not-loaded');
    
    useEffect(() => {
        loadNFTs();
    }, []);

    async function loadNFTs() {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
        const data = await marketContract.fetchMyNFTs();
    
        const items = await Promise.all(data.map(async (i: any) => {
          const tokenUri = await tokenContract.tokenURI(i.tokenId);
          const meta = await axios.get(tokenUri);
          
          let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
          let item = {
            price,
            tokenId: i.tokenId.toNumber(),
            seller: i.seller,
            owner: i.owner, 
            image: JSON.parse(Object.keys(meta.data)[0]).image,
          };
          return item;
        }))
        setNfts(items);
        setLoadingState('loaded');
      }

    if (loadingState === "loaded" && !nfts.length)
        return (
            <h1 className="py-10 px-20 text-3xl">
                No assets owned
            </h1>
        )

    return (
        <div className="flex justify-center">
            <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {
                    nfts.map((nft, i) => (
                        <div key={i} className="border border-transparent shadow rounded-xl overflow-hidden">
                            <img src={nft.image} className="rounded" />
                            <div className="p-4 bg-black">
                                <p className="text-white" style={{fontFamily: "Noto Sans", fontWeight: 200}}>
                                    Price <br/> <span className="text-3xl">{nft.price}</span> ETH
                                </p>
                            </div>
                        </div>
                    ))
                }
                </div>
            </div>
        </div>
    )
        
}