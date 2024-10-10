async function main() {
    const NFTMarket = await ethers.getContractFactory("NFTMarket");
    const nftMarket = await NFTMarket.deploy();

    await nftMarket.deployed();
    console.log("nftMarket deployed to: ", nftMarket.address);

    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(nftMarket.address);

    await nft.deployed();
    console.log("nft deployed to: ", nft.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });