'reach 0.1';
'use strict';

const EveryOne = {
  ...hasRandom
}

const CreatorObject = {
  createNFT: Fun([], Object({owner: Address, creator: Address, price: UInt, royalty: UInt }))
};

const NFT = {
  owner: "0x0",
  creator: "0x0",
  // name : "",
  // uri: "",
  price: 0,
  royalty: 0
}

export const main = Reach.App(() => {
  const Creator = Participant('Creator', {
    ...EveryOne,
    ...CreatorObject
    // Specify Alice's interact interface here
  });
  const Buyer = Participant('Buyer', {
    getNFTInfo: Fun([Object({owner: Address, creator: Address, price: UInt, royalty: UInt })], Null)
    // Specify Bob's interact interface here
  });
  init();

  Creator.only(() =>{
    const nft = declassify(interact.createNFT());
  })
  // The first one to publish deploys the contract
  Creator.publish(nft);
  commit();

  Buyer.only(()=>{
    interact.getNFTInfo(nft);
  })
  // The second one to publish always attaches
  Buyer.publish();
  commit();
  // write your program here
  exit();
});
