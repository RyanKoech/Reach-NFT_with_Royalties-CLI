import {loadStdlib} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib(process.env);

const startingBalance = stdlib.parseCurrency(100);

const fmt = (x) => stdlib.formatCurrency(x, 4);

const [ creatorAccount, buyerAccount ] =
  await stdlib.newTestAccounts(2, startingBalance);
console.log('Try out my first Reach Application');

const creatorAccAddress = creatorAccount.getAddress();

console.log('Launching...');
const creatorContract = creatorAccount.contract(backend);
const buyerContract = buyerAccount.contract(backend, creatorContract.getInfo());

console.log('Starting backends...');
await Promise.all([
  backend.Creator(creatorContract, {
    ...stdlib.hasRandom,
    createNFT: () => {
      return {
        owner: creatorAccAddress,
        creator: creatorAccAddress,
        // name : "",
        // uri: "",
        price: stdlib.parseCurrency(1.1),
        royalty: 0
      }
    }
    // implement Alice's interact object here
  }),
  backend.Buyer(buyerContract, {
    ...stdlib.hasRandom,
    getNFTInfo: (nftInfo) => {
      console.log("NFT...")
      console.log(nftInfo)
    }
    // implement Bob's interact object here
  }),
]);

console.log('Goodbye, Crrator and Buyer!');
