'reach 0.1';
'use strict';

const Details = Object({basePrice: UInt, uri: Bytes(100) });

export const main = Reach.App(() => {

  const Creator = Participant('Creator', {
    getId: UInt,
    createNFT: Fun([], Details),
    deadline: UInt,
  });

  const Owner = API('Owner', {
    isAuctionOn: Fun([Bool], Null)
  });

  const Bidder = API('Bidder', {
    getBid: Fun([UInt], Null),
  });

  const Info = View('Info', { 
    details : Details,
    owner : Address
  });

  const Notify = Events({
    seeOutcome: [Address, UInt],
    showBid: [Address, UInt],
    isAuctionOn: [Bool],
  });

  init();
  Creator.only(() => {
   const id = declassify(interact.getId);
   const deadline = declassify(interact.deadline);
   const nftInfo = declassify(interact.createNFT());
  });

  Creator.publish(id, deadline, nftInfo);
  Notify.isAuctionOn(true);

  Info.details.set(nftInfo);

  var loopOn = true;
  invariant(balance() == 0)
  while(loopOn){
    commit();

    Creator.publish();
    const [owner, price, lastBidder, keepGoing, auctionOn, firstBid] = 
    parallelReduce([ Creator, nftInfo.basePrice, Creator, true, true, true])
    .define(()=>{
      Info.owner.set(owner);
    })
    .invariant(balance() == (firstBid ? 0 : price))
    .while(keepGoing)
    .api_(Owner.isAuctionOn, (enteredIsAuctionOn) => {
      check(this === owner, "Not the nft owner");
      check(auctionOn === false, "The auction is already going on");
      return [0, (ret)=>{
        Notify.isAuctionOn(enteredIsAuctionOn);
        ret(null);
        return [owner, price, lastBidder, keepGoing, enteredIsAuctionOn, firstBid];
      }]
    })
    .api_(Bidder.getBid, (bid) => {
      check(auctionOn === true, "Nft not for sale")
      check(this !== owner, "Cannot buy your nft")
      check(this !== lastBidder, "Already placed bid")
      check(bid > price, "Need to bid a higher price")
      return [bid, (ret) => {
        transfer(firstBid ? 0 : price).to(lastBidder);
        ret(null);
        Notify.showBid(this, bid);
        return [owner, bid, this, true, true, false]
      }]
    })
    .timeout(relativeTime(deadline), () => {
      Creator.publish();
      if(lastBidder !== owner) {
        Notify.seeOutcome(lastBidder, price);
      }
      Notify.isAuctionOn(false);
      transfer(firstBid ? 0 : price).to(owner);
      return [lastBidder, nftInfo.basePrice, lastBidder, true, false, true];
    });
    transfer(firstBid ? 0 : price).to(owner);
    continue;
  };
  commit();
  exit();
});