"use client"

import { useState } from "react";
import { ethers, Signer } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/navigation";
import Web3modal from 'web3modal';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

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
            const added = await client.add(file, {
                progress: (prog) => console.log(`received ${prog}`)
            });
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            setFileUrl(url);

        } catch (err) {
            console.log(err);
            
        }
    }

    async function createItem() {
        const { name, description, price} = formInput;
        if (!name || !description || !price || !fileUrl) return;

        const data = JSON.stringify({
            name, description, image: fileUrl
        });

        try {
            const added = await client.add(data);
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            createSale(url)

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
        let transaction = await contract.createToken(url);
        let tx = await transaction.wait();

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
                    onChange={event => updateFormInput({ ...formInput, name: event.target.value})}
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