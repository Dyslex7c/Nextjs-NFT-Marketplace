"use client"

import { useState } from "react";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/navigation";
import axios from "axios";
import Web3modal from 'web3modal';

const pinataApiKey = '3b2e9485d3d6c51ec593';
const pinataSecretApiKey = '55ae1f11787102239d47de16abfa3b4d85aeaff15907ba38b9f2892479fb56a8';

import { nftaddress, nftmarketaddress } from "@/nftmarket.config";

import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [formInput, updateFormInput] = useState({ price: '', name: '', description: ''});

    const router = useRouter();

    async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
                maxContentLength: Infinity,
                headers: {
                    'Content-Type': `multipart/form-data`,
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                },
            });

            const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
            setFileUrl(url);

        } catch (err) {
            console.log(err);
            
        }
    }

    async function createItem() {        
        const { name, description, price} = formInput;
        console.log(name);
        console.log(description);
        console.log(price);
        console.log(fileUrl);
        
             
        if (!name || !description || !price || !fileUrl) return;        

        const data = JSON.stringify({
            name, description, image: fileUrl
        });

        try {
            const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', data, {
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                },
            });

            const url = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
            createSale(url);

        } catch (err) {
            console.log(err);
        }
    }

    async function createSale(url: any) {
        const web3modal = new Web3modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
        console.log(contract);
        
        let transaction = await contract.createToken(url);
        let tx = await transaction.wait();
        console.log(tx);
        
        let event = tx.events[0];
        let value = event.args[2];
        let tokenId = value.toNumber();

        const price = ethers.utils.parseUnits(formInput.price, 'ether');

        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
        let listingPrice = await contract.getListingPrice();

        listingPrice = listingPrice.toString();

        transaction = await contract.createMarketItem(nftaddress, tokenId, price, { value: listingPrice });
        await transaction.wait();
        router.push("/");
    }

    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input
                    placeholder="Asset Name"
                    className="mt-8 border rounded p-4 bg-black"
                    onChange={event => updateFormInput({ ...formInput, name: event.target.value})}
                />
                <textarea
                    placeholder="Asset Description"
                    className="mt-2 border rounded p-4 bg-black"
                    onChange={event => updateFormInput({ ...formInput, description: event.target.value})}
                />
                <input
                    placeholder="Asset Price"
                    className="mt-2 border rounded p-4 bg-black"
                    onChange={event => updateFormInput({ ...formInput, price: event.target.value})}
                />
                <input 
                    type="file"
                    name="Asset"
                    className="my-4 bg-black"
                    onChange={onChange}
                />
                {
                    fileUrl && (
                        <img className="rounded mt-4" width="350" src={fileUrl} />
                    )
                }
                <button
                    onClick={createItem}
                    className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg"
                >
                    Create Digital Asset
                </button>
            </div>
        </div>
    )
}