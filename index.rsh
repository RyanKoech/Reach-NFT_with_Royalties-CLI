'reach 0.1';

const BaseUser = {
  ...hasRandom,
  getSenderAddress: Address
}


const NFT_Template = {
  owner: "0x0",
  creator: "0x0",
  // name : "",
  // uri: "",
  price: 0,
  royalty: 0
}

export const main = Reach.App(() => {


  const Creator = Participant('Creator', {
    ...BaseUser,
    deadline: UInt,
    createNFT: Fun([], Object({owner: Address, creator: Address, price: UInt, royalty: UInt }))
    // Specify Alice's interact interface here
  });

  const Owner = Participant('Owner',{
    ...BaseUser,
    setNFTPrice: Fun([], UInt),
    isOwner: Fun([Bool], Null)
  });

  const Buyer = Participant('Buyer', {
    ...BaseUser,
    getNFTInfo: Fun([Object({owner: Address, creator: Address, price: UInt, royalty: UInt })], Null),
    getNFTPrice: Fun([], UInt),
    buyNFT: Fun([UInt], Null)
    // Specify Bob's interact interface here
  });
  init();

  // BEGIN OF CODE WORKFLOW
  Creator.only(() =>{
    const nft = declassify(interact.createNFT());
    // assert(nft.royalty >= 0 && nft.royalty < 50);
    const deadline = declassify(interact.deadline)
  })
  // The first one to publish deploys the contract
  Creator.publish(nft, deadline);
  commit();

  Buyer.only(()=>{
    interact.getNFTInfo(nft);
  })
  // The second one to publish always attaches
  Buyer.publish();
  commit();

  Buyer.only(()=>{
    interact.buyNFT(nft.price)
    const buyerAddress = declassify(interact.getSenderAddress);
  });
  Buyer.publish(buyerAddress);
  commit();

  Buyer.pay(nft.price)
    .timeout(relativeTime(deadline), () => {});
  transfer(nft.price).to(nft.owner);
  commit();
  // Owner.only(() => {
  //   // const newPrice = nft.price

  //   // newPrice = 0
  //   // if(interact.getSenderAddress == nft.owner){
  //   //   const newPrice = declassify(interact.setNFTPrice())
  //   // }
  // });
  // Owner.publish();
  // commit();
  
  // write your program here
  exit();
});
