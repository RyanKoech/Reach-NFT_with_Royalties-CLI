import { loadStdlib, test } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';

// Basics
const stdlib = loadStdlib({ REACH_NO_WARN: 'Y' });

//Framework
const makeNft = async({creatorLabel, getId, nftDetails, deadline : timeLimit}) => {
  const sbal = stdlib.parseCurrency(100);
  const accCreator = await stdlib.newTestAccount(sbal);
  accCreator.setDebugLabel(creatorLabel);
  
  const stdPerson = (obj) => {
    const { acc } = obj;
    const getBalance = async () => {
      const bal = await acc.balanceOf();
      return `${stdlib.formatCurrency(bal, 4)} ${stdlib.standardUnit}`;
    };
    return {
      ...obj,
      getBalance,
    };
  };

  const Creator = stdPerson({
    acc: accCreator,
    label: creatorLabel,
    startAuction: (ctc) => {},
  });

  const waitUntilDeadline = async () => {
    const deadline = (await stdlib.getNetworkTime()).add(timeLimit * 3);
    console.log(`Waiting until ${deadline}`);
    await stdlib.waitUntilTime(deadline);
  };

  const details = nftDetails;
  const ctcCreator = accCreator.contract(backend);
  ctcCreator.participants.Creator(
    {
      createNFT : () => {
        return details
      },
      getId,
      deadline : timeLimit
    }
  );
  const ctcInfo = ctcCreator.getInfo();
  console.log(`${creatorLabel} launched contract`);

  ctcCreator.e.isAuctionOn.monitor((event) => {
    const {when, what : [auctionOn]} = event
    console.log(`Auction on is ${auctionOn}`)
  });

  ctcCreator.e.showBid.monitor((event) => {
    const {when, what : [_who, bid]} = event
    const who = stdlib.formatAddress(_who);
    console.log(`${creatorLabel} sees ${who} places a bid of ${bid}`)
  })

  ctcCreator.e.seeOutcome.monitor((event) => {
    const {when, what : [_who, bid]} = event
    const who = stdlib.formatAddress(_who);
    console.log(`${creatorLabel} sees ${who} bought the nft at a price of ${bid}`)
  })

  const makeBidder = async (label) => {
    const acc = await stdlib.newTestAccount(sbal);
    acc.setDebugLabel(label);
    const ctcBidder = acc.contract(backend, ctcInfo);

    const placeBid = async (bid) => {
      await ctcBidder.a.Bidder.getBid(bid)
      console.log(`${label} placed a bid of ${bid}`)
    }

    const startAuction = async () => {
      console.log("Called")
      await ctcBidder.a.Owner.isAuctionOn(true);
      console.log(`${label} starting the auction`);
    }

    return stdPerson({
      acc, label, placeBid, startAuction
    });
  }

  const makeBidders = (labels) => Promise.all(labels.map(makeBidder));

  Creator.startAuction = async () => {
    console.log("Called")
    await ctcCreator.a.Owner.isAuctionOn(true);
    console.log(`${creatorLabel} starting the auction`);
  }

  return {Creator, makeBidder, makeBidders, waitUntilDeadline};

};


// Test Scenarios
test.one('NFTEST', async () => {
  const NFT = await makeNft({
    creatorLabel: 'Creator',
    getId: 100,
    nftDetails: {
      basePrice: stdlib.parseCurrency(10),  
      uri: '12345678'
    },
    deadline: 50,
  });

  const Creator = NFT.Creator;
  const Bidders = await NFT.makeBidders([
    'Bidder1', 'Bidder2', 'Bidder3'
  ]);
  const [Bidder1, Bidder2, Bidder3] = Bidders;

  // await Creator.startAuction();
  await Bidder1.placeBid(stdlib.parseCurrency(25));
  await test.chkErr('Creator', 'The auction is already going on', async () => {
    await Creator.startAuction();
  });
  await Bidder3.placeBid(stdlib.parseCurrency(30));
  await test.chkErr('Bidder1', 'Need to bid a higher price', async () => {
    await Bidder1.placeBid(stdlib.parseCurrency(30));
  });
  await test.chkErr('Bidder3', 'Already placed bid', async () => {
    await Bidder3.placeBid(stdlib.parseCurrency(40));
  });
  await Bidder2.placeBid(stdlib.parseCurrency(35));
  await Bidder3.placeBid(stdlib.parseCurrency(40));
  await NFT.waitUntilDeadline();
  await test.chkErr('Creator', 'Not the nft owner', async () => {
    await Creator.startAuction();
  });
  await test.chkErr('Bidder1', 'Nft not for sale', async () => {
    await Bidder1.placeBid(stdlib.parseCurrency(30));
  });
  await Bidder3.startAuction();
  await Bidder1.placeBid(stdlib.parseCurrency(25));
  await Bidder2.placeBid(stdlib.parseCurrency(35));
  await test.chkErr('Bidder3', 'Cannot buy your nft', async () => {
    await Bidder3.placeBid(stdlib.parseCurrency(40));
  });
  await NFT.waitUntilDeadline();

  for (const p of [Creator, ...Bidders]) {
    const bal = await p.getBalance();
    console.log(`${p.label} has ${bal}`)
  }
});

await test.run({ noVarOutput: true });