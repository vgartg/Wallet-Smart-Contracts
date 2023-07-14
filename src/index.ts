//import { beginCell } from "ton";
//import { toNano, Address } from "ton";
//import { TonClient } from "ton";
import { mnemonicToWalletKey, mnemonicNew } from "ton-crypto";
//import { sign } from 'ton-crypto';
import { compileFunc } from '@ton-community/func-js';
import fs from 'fs'; // we use fs for reading content of files
import { Cell } from "ton-core";
import { beginCell } from "ton-core";
import { Address } from "ton-core";
import { sign } from "ton-crypto";
import { toNano } from "ton-core";
import { TonClient } from "ton";


async function main() {
//     console.log("Hello, TON!");

//     let internalMessageBody = beginCell().
//   storeUint(0, 32). // write 32 zero bits to indicate that a text comment will follow
//   storeStringTail("Hello, TON!"). // write our text comment
//   endCell();

//   const walletAddress = Address.parse('EQDV7E-B5zQc55p8zJpcT1j4WrjPv8iIbJJ-lCNRXymdV4qw');

//   let internalMessage = beginCell().
//   storeUint(0, 1). // indicate that it is an internal message -> int_msg_info$0
//   storeBit(1). // IHR Disabled
//   storeBit(1). // bounce
//   storeBit(0). // bounced
//   storeUint(0, 2). // src -> addr_none
//   storeAddress(walletAddress).
//   storeCoins(toNano("0.2")). // amount
//   storeBit(0). // Extra currency
//   storeCoins(0). // IHR Fee
//   storeCoins(0). // Forwarding Fee
//   storeUint(0, 64). // Logical time of creation
//   storeUint(0, 32). // UNIX time of creation
//   storeBit(0). // No State Init
//   storeBit(1). // We store Message Body as a reference
//   storeRef(internalMessageBody). // Store Message Body as a reference
//   endCell();

//     const client = new TonClient({
//       endpoint: "https://toncenter.com/api/v2/jsonRPC",
//       apiKey: "41cf874ced9a52d57258660734ec9c50dced9c75a3cc2009b176970f6b0ea497" // you can get an api key from @tonapibot bot in Telegram
//     });
    

//     const mnemonic = 'huge another such vote kite middle quality delay attract lazy era add army rare melt talent sail opinion gossip curtain visual estate best speed'; // word1 word2 word3
//     let getMethodResult = await client.runMethod(walletAddress, "seqno"); // run "seqno" GET method from your wallet contract
//     let seqno = getMethodResult.stack.readNumber(); // get seqno from response
    
//     const mnemonicArray = mnemonic.split(' '); // get array from string
//     const keyPair = await mnemonicToWalletKey(mnemonicArray); // get Secret and Public keys from mnemonic 

//     let toSign = beginCell().
//   storeUint(698983191, 32). // subwallet_id | We consider this further
//   storeUint(Math.floor(Date.now() / 1e3) + 600, 32). // Transaction expiration time, +60 = 1 minute
//   storeUint(seqno, 32). // store seqno
//   storeUint(3, 8). // store mode of our internal transaction
//   storeRef(internalMessage); // store our internalMessage as a reference

// let signature = sign(toSign.endCell().hash(), keyPair.secretKey); // get the hash of our message to wallet smart contract and sign it to get signature

// let body = beginCell().
//   storeBuffer(signature). // store signature
//   storeBuilder(toSign). // store our message
//   endCell();

//   let externalMessage = beginCell().
//   storeUint(0b10, 2). // 0b10 -> 10 in binary
//   storeUint(0, 2). // src -> addr_none
//   storeAddress(walletAddress). // Destination address
//   storeCoins(0). // Import Fee
//   storeBit(0). // No State Init
//   storeBit(1). // We store Message Body as a reference
//   storeRef(body). // Store Message Body as a reference
//   endCell();

//   console.log(externalMessage.toBoc().toString("base64"))

//   client.sendFile(externalMessage.toBoc());

const mnemonicArray = await mnemonicNew(24); // 24 is the number of words in a seed phrase
const keyPair = await mnemonicToWalletKey(mnemonicArray); // extract private and public keys from mnemonic
console.log(mnemonicArray) // if we want, we can print our mnemonic

const subWallet = 698983191;

const result = await compileFunc({
targets: ['wallet_v3.fc'], // targets of your project
sources: {
    "stdlib.fc": fs.readFileSync('./src/stdlib.fc', { encoding: 'utf-8' }),
    "wallet_v3.fc": fs.readFileSync('./src/wallet_v3.fc', { encoding: 'utf-8' }),
}
});

if (result.status === 'error') {
console.error(result.message)
return;
}

const codeCell = Cell.fromBoc(Buffer.from(result.codeBoc, "base64"))[0]; // get buffer from base64 encoded BOC and get cell from this buffer

// now we have base64 encoded BOC with compiled code in result.codeBoc
console.log('Code BOC: ' + result.codeBoc);
console.log('\nHash: ' + codeCell.hash().toString('base64')); // get the hash of cell and convert in to base64 encoded string. We will need it further

const dataCell = beginCell().
  storeUint(0, 32). // Seqno
  storeUint(698983191, 32). // Subwallet ID
  storeBuffer(keyPair.publicKey). // Public Key
  endCell();

  const stateInit = beginCell().
  storeBit(0). // No split_depth
  storeBit(0). // No special
  storeBit(1). // We have code
  storeRef(codeCell).
  storeBit(1). // We have data
  storeRef(dataCell).
  storeBit(0). // No library
  endCell();

const contractAddress = new Address(0, stateInit.hash()); // get the hash of stateInit to get the address of our smart contract in workchain with ID 0
console.log(`Contract address: ${contractAddress.toString()}`); // Output contract address to console

const internalMessageBody = beginCell().
  storeUint(0, 32).
  storeStringTail("Hello, TON!").
  endCell();

const internalMessage = beginCell().
  storeUint(0x10, 6). // no bounce
  storeAddress(Address.parse("kQDo2XD-pkY7X_b06JiGQxu_DGZiOpiE6xtaxWEyKclvTpNm")).
  storeCoins(toNano("0.03")).
  storeUint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1). // We store 1 that means we have body as a reference
  storeRef(internalMessageBody).
  endCell();

// transaction for our wallet
const toSign = beginCell().
  storeUint(subWallet, 32).
  storeUint(Math.floor(Date.now() / 1e3) + 600, 32).
  storeUint(0, 32). // We put seqno = 0, because after deploying wallet will store 0 as seqno
  storeUint(3, 8).
  storeRef(internalMessage);

const signature = sign(toSign.endCell().hash(), keyPair.secretKey);
const body = beginCell().
  storeBuffer(signature).
  storeBuilder(toSign).
  endCell();

  const externalMessage = beginCell().
  storeUint(0b10, 2). // indicate that it is an incoming external transaction
  storeUint(0, 2). // src -> addr_none
  storeAddress(contractAddress).
  storeCoins(0). // Import fee
  storeBit(1). // We have State Init
  storeBit(1). // We store State Init as a reference
  storeRef(stateInit). // Store State Init as a reference
  storeBit(1). // We store Message Body as a reference
  storeRef(body). // Store Message Body as a reference
  endCell();

  const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: "bf64af6b96de5b18080075a6fc0c3fb9f2fe1262e6cb251413672c9d621a9b0f" // you can get an api key from @tonapibot bot in Telegram
  });
  
  client.sendFile(externalMessage.toBoc());
  }
  
  
  main().finally(() => console.log("Exiting..."));