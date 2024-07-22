import * as bitcoin from "bitcoinjs-lib";
export interface IWalletDetails {
  ordinal_address: string;
  cardinal_address: string;
  ordinal_pubkey: string;
  cardinal_pubkey: string;
  wallet: string | null;
  connected?: boolean;
}

export interface Status {
  confirmed: boolean;
  block_height: number;
  block_hash: string;
  block_time: number;
}

export interface RuneDetails {
  amount: number;
  divisibility: number;
  symbol: string;
}

export interface Rune {
  [key: string]: RuneDetails;
}

export interface AddressTxsUtxo {
  txid: string;
  vout: number;
  status: Status;
  value: number;
  rune: Rune;
  utxo_id: string;
  address: string;
}

export interface IRuneBase {
  rune_name: string;
  rune_amount: number;
  rune_divisibility: number;
  rune_symbol: string;
}
 export interface IRune extends IRuneBase {
    _id?:string;}

export interface IUTXOs {
  txid: string;
  vout: number;
  status: Status;
  value: number;
  rune_divisibility: number;
  rune_name: string;
  rune_amount: number;
  rune_symbol: string;
  utxo_id: string;
  address: string;
}


export interface Utxo {
  _id: string;
  address: string;
  txid: string;
  vout: number;
  utxo_id: string;
  value: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  rune_name: string;
  rune_amount: number;
  rune_divisibility: number;
  rune_symbol: string;
  maker_fee_bp: number;
  listed?: boolean;
  listed_price: number;
  listed_price_per_token: number;
  listed_maker_fee_bp: number;
  __v: number;
}

export interface IItem {
  price: number;
  utxo_id: string;
}

export interface ITransaction {
  pay_address?:string;
  receive_address: string;
  publickey: string;
  wallet: string;
  items: IItem[];
}

export interface IBalanceData {
  balance: number;
  mempool_balance: number;
  mempool_txs: string[];
  dummyUtxos?: number;
}

export interface IListingStateUTXO {
  status: {
    block_hash: string;
    block_height: number;
    block_time: number;
    confirmed: boolean;
  };
  txid: string;
  value: number;
  vout: number;
  tx: bitcoin.Transaction;
}
export interface IListingState {
  seller: {
    makerFeeBp: number;
    sellerOrdAddress: string;
    price: number;
    ordItem: any;
    sellerReceiveAddress: string;
    unsignedListingPSBTBase64?: string;
    signedListingPSBTBase64?: string;
    tapInternalKey?: string;
  };

  buyer: {
    takerFeeBp: number;
    buyerAddress: string;
    buyerTokenReceiveAddress: string;
    fee_rate: number;
    buyerPublicKey: string;
    unsignedBuyingPSBTBase64?: string;
    unsignedBuyingPSBTInputSize?: number;
    signedBuyingPSBTBase64?: string;
    buyerDummyUTXOs?: IListingStateUTXO[];
    buyerPaymentUTXOs?: AddressTxsUtxo[]; // after the selection
    mergedSignedBuyingPSBTBase64?: string;
  };
}


export interface ItemsDetails {
  price: number;
  utxo_id?: string; // Make utxo_id optional if it can be undefined
}
export interface ListData {
  unsigned_listing_psbt_base64: string;
  tap_internal_key?: string; // Make tap_internal_key optional if it can be undefined
  signed_listing_psbt_base64: string;
  receiveAddress?: string; // Make receiveAddress optional if it can be undefined
  wallet?: string | null; // Make wallet optional if it can be null or undefined
  publickey?: string; // Make publickey optional if it can be undefined
  items?: ItemsDetails[]; // Make items optional if it can be undefined
}


interface OrderInput {
  unsigned_listing_psbt_base64: string;
  tap_internal_key: string;
  listing: Listing;
  signed_listing_psbt_base64: string;
}

interface Listing {
  seller: Seller;
}

interface Seller {
  maker_fee_bp?: number;
  seller_ord_address: string;
  receive_address: string;
  price: number;
  tap_internal_key: string;
  unsigned_listing_psbt_base64: string;
}