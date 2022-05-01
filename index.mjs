import { loadStdlib } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';

(async () => {
    const stdlib = await loadStdlib();
    const startingBalance = stdlib.parseCurrency(10);
 

    const accCreator = await stdlib.newTestAccount(startingBalance);
    const accBidderA = await stdlib.newTestAccount(startingBalance);
    const accBidderB = await stdlib.newTestAccount(startingBalance);
    const addessBidderA = accBidderA.getAddress();



    const fmt = (x) => stdlib.formatCurrency(x, 4);
    const getBalance = async (who) => fmt(await stdlib.balanceOf(who));
 
    const ctcCreator = accCreator.contract(backend);
    const ctcInfo = ctcCreator.getInfo(); 

    const bids = {
        "BiddderA": {
            maxBid: stdlib.parseCurrency(9),
        },
        "BidderB": {
            maxBid: stdlib.parseCurrency(6),
        },
    };

    const id = stdlib.randomUInt();
    const deadline = 200;
    const meter = {
        meter: 0,
        bidder: "",
    }
    
    const Common = (who) => ({
        seeOutcome: (price, address) => {
            const winner = (stdlib.addressEq(addessBidderA, address)) ? "BiddderA" : "BidderB";
            console.log(`${who} Saw The Winner is: `, winner);
        },
        showBid: (bid) => {
            console.log(`${who} saw the bid of ${fmt(bid)} from ${meter.bidder}` );
        },
        informTimeout: () => {
            console.log("Payment was not performed.")
            process.exit(0);
        },
        isAuctionOn: () => {
            meter.meter += 1;
            if(meter.meter == 3){
                console.log(`${who} ended auction.`)
                return false;
            };
            console.log(`${who} started the auction.`)
            return true;
        }
    });

    const makeOwner = (acc, who) => {
        const ctc = acc.contract(backend, ctcInfo);
        return backend.Bidder(ctc, {
            ...Common(who),
            getBid: (price) => {
              console.log(who," see's the price as: ", fmt(price))
                if (stdlib.add(price, stdlib.parseCurrency(1)) < bids[who].maxBid) {
                    const bid = stdlib.add(price, stdlib.parseCurrency(1));
                    console.log(who," therefore bids ", fmt(bid), "ALGO")
                    meter.bidder = who
                    return bid;
                };
                return price;
            }
        })
    };

    await Promise.all([
        backend.Creator(
            ctcCreator,{
            ...Common("Creator"),
            createNFT: () => {
              return {
                basePrice: stdlib.parseCurrency(3), 
                royalty: 49, 
                uri: ""
              }
            },
            getId: id,
            deadline: deadline,
        }),

        makeOwner(accBidderA, "BiddderA"),
        makeOwner(accBidderB, "BidderB"),
    ]);


  const bobAfter = await getBalance(accBidderB);
  const aliceAfter = await getBalance(accBidderA);
  const creatorAfter = await getBalance(accCreator);
  console.log("BidderB now left with: " + bobAfter);
  console.log("BiddderA now left with: " + aliceAfter);
  console.log("Creator now left with: " + creatorAfter);
})();