import {loadStdlib} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib(process.env);

const startingBalance = stdlib.parseCurrency(100);

const fmt = (x) => stdlib.formatCurrency(x, 4);
const getBalance = async (who) => fmt(await stdlib.balanceOf(who));

const [ creatorAccount, buyerAccount ] =
  await stdlib.newTestAccounts(2, startingBalance);
console.log('Try out my first Reach Application');

const creatorAccAddress = creatorAccount.getAddress();

console.log('Launching...');
const creatorContract = creatorAccount.contract(backend);
const buyerContract = buyerAccount.contract(backend, creatorContract.getInfo());

const BaseUser = {
  ...stdlib.hasRandom,
  getSenderAddress : () => {}
}

console.log('Starting backends...');
await Promise.all([
  backend.Creator(creatorContract, {
    ...stdlib.hasRandom,
    getSenderAddress: creatorAccount.getAddress(),
    deadline: { ETH: 100, ALGO: 5, CFX: 1000 }[stdlib.connector],
    createNFT: () => {
      return {
        owner: creatorAccAddress,
        creator: creatorAccAddress,
        // name : "",
        // uri: "",
        price: stdlib.parseCurrency(20.5),
        royalty: 25
      }
    }
    // implement Alice's interact object here
  }),
  backend.Buyer(buyerContract, {
    ...stdlib.hasRandom,
    getSenderAddress: buyerAccount.getAddress(),
    getNFTInfo: (nftInfo) => {
      console.log("NFT...")
      console.log(nftInfo)
    },
    buyNFT: (price) => {
      console.log("Buyer accepts to buy NFT at ALGO: " + fmt(price) );
    }
    // implement Bob's interact object here
  }),
]);

const buyerAfter = await getBalance(buyerAccount);
const creatorAfter = await getBalance(creatorAccount);
console.log("Buyer now left with: " + buyerAfter);
console.log("Creator now left with: " + creatorAfter);
console.log('Goodbye, Creator and Buyer!');
