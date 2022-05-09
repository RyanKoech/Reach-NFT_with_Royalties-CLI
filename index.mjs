import { loadStdlib, ask } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';

(async () => {
    const stdlib = await loadStdlib();
    const startingBalance = stdlib.parseCurrency(100);
    const fmt = (x) => stdlib.formatCurrency(x, 4);
    const getBalance = async (who) => fmt(await stdlib.balanceOf(who));

    const isCreator = await ask.ask(
        `Are you a Creator?`,
        ask.yesno
    );
    const who = isCreator ? 'Creator' : 'Bidder';
    
    console.log(`Starting Nft Market! as ${who}`);
    
    let acc = null;
    const createAcc = await ask.ask(
        `Would you like to create an account? (only possible on devnet)`,
        ask.yesno
    );
    if (createAcc) {
        acc = await stdlib.newTestAccount(startingBalance);
    } else {
        const secret = await ask.ask(
            `What is your account secret?`,
            (x => x)
        );
        acc = await stdlib.newAccountFromSecret(secret);
    }
    
    let ctc = null;
    if (isCreator) {
      ctc = acc.contract(backend);
      ctc.getInfo().then((info) => {
        console.log(`The contract is deployed as = ${JSON.stringify(info)}`); });
    } else {
      const info = await ask.ask(
        `Please paste the contract information:`,
        JSON.parse
      );
      ctc = acc.contract(backend, info);
    }

    const before = await getBalance(acc);
    console.log(`Your balance is ${before}`);

    const Interact = {
        seeOutcome: (price, address) => {
            const winner = stdlib.formatAddress(address)
            console.log(`The Winner of address: ${address} has paid ${price}`);
        },
        showBid: (bid) => {
            console.log(`A bid of ${fmt(bid)} has been placed` );
        },
        informTimeout: () => {
            console.log("Payment was not performed.")
            process.exit(0);
        },
        isAuctionOn: async () => {

            const startAuction = await ask.ask(
                `Do you want to start the auction?`,
                ask.yesno
            );

            if(!startAuction){
                console.log(`Auction has been ended.`)
                return false;
            };
            console.log(`Auction has been started.`)
            return true;
        }
    };

    if(isCreator){
        const id = await ask.ask(
            `Enter NFT Id: `,
            (x => x)
          );

        const deadline = await ask.ask(
            `Enter Auction Dealine: `,
            (x => x)
        );


        const basePirce = await ask.ask(
            `Enter Base Price: `,
            (x => x)
        );


        const royalty = await ask.ask(
            `Enter Asking Royalty: `,
            (x => x)
        );


        const url = await ask.ask(
            `Enter NFT url: `,
            (x => x)
        );

        Interact.createNFT = () => {
              return {
                basePrice: stdlib.parseCurrency(basePirce), 
                royalty: royalty, 
                uri: url
              }
            },
        Interact.getId = id
        Interact.deadline = deadline
    }else{

        Interact.getBid = async (price) => {
            console.log("Current price is: ", fmt(price))

            const counterBid = await ask.ask(
                `Enter Counter Bid: `,
                (x => x)
              );

            if (price < stdlib.parseCurrency(counterBid)) {
                console.log("You have bid ", counterBid, "ALGO");
                return stdlib.parseCurrency(counterBid);
            };
            console.log("You have bid ", fmt(price), "ALGO")
            return price;
        }

    }

    const part = isCreator ? ctc.p.Creator : ctc.p.Bidder;
    await part(Interact);

    const after = await getBalance(acc);
    console.log(`Your balance is now ${after}`);

    ask.done();
    
//     const accCreator = await stdlib.newTestAccount(startingBalance);
//     const accBidderA = await stdlib.newTestAccount(startingBalance);
//     const accBidderB = await stdlib.newTestAccount(startingBalance);
//     const addessBidderA = accBidderA.getAddress();

 
//     const ctcCreator = accCreator.contract(backend);
//     const ctcInfo = ctcCreator.getInfo(); 

//     const bids = {
//         "BiddderA": {
//             maxBid: stdlib.parseCurrency(9),
//         },
//         "BidderB": {
//             maxBid: stdlib.parseCurrency(6),
//         },
//     };

//     const id = stdlib.randomUInt();
//     const deadline = 200;
//     const meter = {
//         meter: 0,
//         bidder: "",
//     }
    
//     const Common = (who) => ({
//         seeOutcome: (price, address) => {
//             const winner = (stdlib.addressEq(addessBidderA, address)) ? "BiddderA" : "BidderB";
//             console.log(`${who} Saw The Winner is: `, winner);
//         },
//         showBid: (bid) => {
//             console.log(`${who} saw the bid of ${fmt(bid)} from ${meter.bidder}` );
//         },
//         informTimeout: () => {
//             console.log("Payment was not performed.")
//             process.exit(0);
//         },
//         isAuctionOn: () => {
//             meter.meter += 1;
//             if(meter.meter == 3){
//                 console.log(`${who} ended auction.`)
//                 return false;
//             };
//             console.log(`${who} started the auction.`)
//             return true;
//         }
//     });

//     const makeOwner = (acc, who) => {
//         const ctc = acc.contract(backend, ctcInfo);
//         return backend.Bidder(ctc, {
//             ...Common(who),
//             getBid: (price) => {
//               console.log(who," see's the price as: ", fmt(price))
//                 if (stdlib.add(price, stdlib.parseCurrency(1)) < bids[who].maxBid) {
//                     const bid = stdlib.add(price, stdlib.parseCurrency(1));
//                     console.log(who," therefore bids ", fmt(bid), "ALGO")
//                     meter.bidder = who
//                     return bid;
//                 };
//                 return price;
//             }
//         })
//     };

//     await Promise.all([
//         backend.Creator(
//             ctcCreator,{
//             ...Common("Creator"),
//             createNFT: () => {
//               return {
//                 basePrice: stdlib.parseCurrency(3), 
//                 royalty: 49, 
//                 uri: ""
//               }
//             },
//             getId: id,
//             deadline: deadline,
//         }),

//         makeOwner(accBidderA, "BiddderA"),
//         makeOwner(accBidderB, "BidderB"),
//     ]);


//   const bobAfter = await getBalance(accBidderB);
//   const aliceAfter = await getBalance(accBidderA);
//   const creatorAfter = await getBalance(accCreator);
//   console.log("BidderB now left with: " + bobAfter);
//   console.log("BiddderA now left with: " + aliceAfter);
//   console.log("Creator now left with: " + creatorAfter);
})();