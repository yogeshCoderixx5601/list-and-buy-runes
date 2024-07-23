"use client";

import { RootState } from "@/stores";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useWalletAddress, useSignTx } from "bitcoin-wallet-adapter";
import { getUtxos } from "@/apiHelper/getUtxos";
import { ITransaction, Utxo } from "@/types";
import { createListPsbt } from "@/apiHelper/createListPsbt";
import { listItems } from "@/apiHelper/listItem";
import ListButton from "@/components/CustomElements/ListButton";
import UtxoItem from "@/components/CustomElements/UtxoItem";
import { CircularProgress } from "@mui/material";
import { addNotification } from "@/stores/reducers/notificationReducer";

interface RunesResponse {
  success: boolean;
  utxo_id: string;
  price: number;
  receive_address: string;
  unsigned_psbt_base64: string;
  tap_internal_key?: string;
  message: "Success";
}

export interface ItemsDetails {
  price: number;
  utxo_id?: string;
}

export interface RequestBody {
  receiveAddress?: string;
  wallet?: string | null;
  publickey?: string;
  items: ItemsDetails[];
}

const RuneUtxos = ({ rune_name }: { rune_name: string }) => {
  const [utxos, setUtxos] = useState<Utxo[]>([]);
  const [inputValues, setInputValues] = useState<{ [key: number]: number }>({});
  const [totals, setTotals] = useState<{ [key: number]: number }>({});
  const [prices, setPrices] = useState<{ [key: number]: number }>({});
  const { loading: signLoading, result, error, signTx: sign } = useSignTx();
  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
  const [action, setAction] = useState<string>("dummy");
  const [loading, setLoading] = useState(false);
  const [utxoLoading, setUtxoLoading] = useState(false);
  const [listItem, setlistitems] = useState<RunesResponse | null>(null);
  const [signPsbt, setSignPsbt] = useState("");
  const [items, setItems] = useState<RequestBody>();
  const [errorMessage, setErrorMessage] = useState<string | "">("");
  const walletDetails = useWalletAddress();
  const dispatch = useDispatch();

  const getRuneUtxosData = async () => {
    setUtxoLoading(true);
    setErrorMessage("");
    try {
      if (walletDetails && walletDetails.connected && walletDetails.ordinal_address) {
        const params = {
          address: walletDetails.ordinal_address,
          rune_name: rune_name,
        };
        const response = await getUtxos(params);
        const utxos = response?.data?.result;
        if (utxos) {
          setUtxos(utxos);
        }
      } else {
        setErrorMessage("Wallet not connected or missing address.");
      }
    } catch (error) {
      console.log("Error fetching rune UTXOs:", error);
      setErrorMessage("Error fetching rune UTXOs.");
    } finally {
      setUtxoLoading(false);
    }
  };

  useEffect(() => {
    getRuneUtxosData();
  }, []);

  const BtcPrice = useSelector((state: RootState) => state.general.btc_price_in_dollar);

  const calculateTotal = (inputValue: number, amount: number, divisibility: number, utxoIndex: number) => {
    if (isNaN(inputValue)) {
      return 0;
    }

    const totalAmount = amount / Math.pow(10, divisibility);
    const total = inputValue * totalAmount;
    setPrices((prev) => ({ ...prev, [utxoIndex]: total }));
    return total / 100000000;
  };

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>, utxoIndex: number) => {
    const value = Number(event.target.value);
    setInputValues((prev) => ({ ...prev, [utxoIndex]: value }));
    const totalValue = calculateTotal(value, utxos[utxoIndex]?.rune_amount, utxos[utxoIndex]?.rune_divisibility, utxoIndex);
    setTotals((prev) => ({ ...prev, [utxoIndex]: totalValue }));
  };

  const listItemData = async (details: ITransaction | null) => {
    console.log(details, "------bulk list item data details");

    if (!details) {
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "No UTXO details provided.",
          open: true,
          severity: "warning",
        })
      );
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await createListPsbt(details);
      if (response?.data) {
        setUnsignedPsbtBase64(response.data.unsigned_psbt_base64);
        setlistitems(response?.data);
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "PSBT created successfully.",
            open: true,
            severity: "success",
          })
        );
      }
    } catch (error) {
      console.error("Error creating list PSBT:", error);
      setErrorMessage("Error creating list PSBT.");
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Error creating list PSBT.",
          open: true,
          severity: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleListAll = async () => {
    setLoading(true);
    setErrorMessage("");
    const itemsDetailsArray = utxos.map((utxo, utxoIndex) => ({
      price: prices[utxoIndex],
      utxo_id: utxo?.utxo_id,
    })).filter((item) => item.price && !isNaN(item.price));

    if (walletDetails && walletDetails.ordinal_address && walletDetails.wallet) {
      const body = {
        receive_address: walletDetails?.ordinal_address,
        wallet: walletDetails?.wallet,
        publickey: walletDetails?.ordinal_pubkey,
        items: itemsDetailsArray,
      };
      setItems(body);
      await listItemData(body);
      setLoading(false);
    } else {
      setErrorMessage("Wallet not connected or missing details");
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Wallet not connected or missing details.",
          open: true,
          severity: "warning",
        })
      );
      setLoading(false);
    }
  };

  const signTx = useCallback(async () => {
    if (!walletDetails) {
      alert("Connect wallet to proceed");
      return;
    }

    let inputs: any = [];
    Object.entries(inputValues).map((_, idx) => {
      inputs.push({
        address: walletDetails.ordinal_address,
        publickey: walletDetails.ordinal_pubkey,
        sighash: 131,
        index: [idx],
      });
    });

    const options: any = {
      psbt: unsignedPsbtBase64,
      network: process.env.NEXT_PUBLIC_NETWORK || "Mainnet",
      action: "sell",
      inputs,
    };

    console.log({ options });

    await sign(options);
  }, [action, unsignedPsbtBase64]);

  useEffect(() => {
    if (result) {
      setSignPsbt(result);
    }

    if (error) {
      console.error("Sign Error:", error);
      alert("Wallet error occurred");
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Wallet error occurred.",
          open: true,
          severity: "error",
        })
      );
      setLoading(false);
    }

    setLoading(false);
  }, [result, error]);

  const sendSignedPsbtAndListItems = async (signedPsbt: string, listItem: RunesResponse | null) => {
    if (!signedPsbt || !listItem) return;
    const listData = {
      ...items,
      unsigned_listing_psbt_base64: listItem.unsigned_psbt_base64,
      tap_internal_key: listItem.tap_internal_key,
      signed_listing_psbt_base64: signedPsbt,
    };

    try {
      const response = await listItems(listData);
      console.log("Response from list item:", response);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Items listed successfully.",
          open: true,
          severity: "success",
        })
      );
    } catch (error) {
      console.error("Error listing item:", error);
      setErrorMessage("Error listing item");
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Error listing item.",
          open: true,
          severity: "error",
        })
      );
    }
  };

  useEffect(() => {
    sendSignedPsbtAndListItems(signPsbt, listItem);
  }, [signPsbt]);

  return (
    <div className="w-full flex flex-col gap-4 p-4 bg-gray-50 rounded-lg shadow-lg text-bla text-customPurple_950">
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      {utxoLoading ? (
        <div className="w-full flex justify-center items-center"><CircularProgress size={30} /></div>
      ) : (
        utxos.map((utxo, utxoIndex) => (
          <UtxoItem
            key={utxoIndex}
            utxo={utxo}
            utxoIndex={utxoIndex}
            inputValue={inputValues[utxoIndex] || 0}
            total={totals[utxoIndex] || 0}
            btcPrice={BtcPrice}
            handleInput={handleInput}
          />
        ))
      )}
      <ListButton
        unsignedPsbtBase64={unsignedPsbtBase64}
        handleListAll={handleListAll}
        signTx={signTx}
        loading={loading}
      />
    </div>
  );
};

export default RuneUtxos;





// "use client";

// import { RootState } from "@/stores";
// import React, { useCallback, useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import { useWalletAddress, useSignTx } from "bitcoin-wallet-adapter";
// import { formatNumber } from "@/utils";
// import { getUtxos } from "@/apiHelper/getUtxos";
// import { ITransaction, Utxo } from "@/types";
// import { createListPsbt } from "@/apiHelper/createListPsbt";
// import {  listItems } from "@/apiHelper/listItem";

// interface RunesResponse {
//   success: boolean;
//   utxo_id: string;
//   price: number;
//   receive_address: string;
//   unsigned_psbt_base64: string;
//   tap_internal_key?: string;
//   message: "Success";
// }

// export interface ItemsDetails {
//   price: number;
//   utxo_id?: string; // Make utxo_id optional if it can be undefined
// }

// export interface RequestBody {
//   receiveAddress?: string;
//   wallet?: string | null;
//   publickey?: string;
//   items: ItemsDetails[];
// }

// const RuneUtxos = ({ rune_name }: { rune_name: string }) => {
//   // change type
//   const [utxos, setUtxos] = useState<Utxo[]>([]);
//   const [inputValues, setInputValues] = useState<{ [key: number]: number }>({});
//   const [totals, setTotals] = useState<{ [key: number]: number }>({});
//   const [prices, setPrices] = useState<{ [key: number]: number }>({});
//   const { loading: signLoading, result, error, signTx: sign } = useSignTx();
//   const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
//   const [action, setAction] = useState<string>("dummy");
//   const [loading, setLoading] = useState(false);
//   const [listItem, setlistitems] = useState<RunesResponse | null>(null);
//   const [signPsbt, setSignPsbt] = useState("");
//   const [items, setItems] = useState<RequestBody>();
//   const walletDetails = useWalletAddress();

//   // Fetch UTXOs for the specified rune_name
//   const getRuneUtxosData = async () => {
//     try {
//       if (
//         walletDetails &&
//         walletDetails.connected &&
//         walletDetails.ordinal_address
//       ) {
//         const params = {
//           address: walletDetails.ordinal_address,
//           rune_name: rune_name,
//         };
//         const response = await getUtxos(params);
//         const utxos = response?.data?.result;
//         if (utxos) {
//           setUtxos(utxos);
//         }
//       }
//     } catch (error) {
//       console.log("Error fetching rune UTXOs:", error);
//     }
//   };

//   useEffect(() => {
//     getRuneUtxosData();
//   }, []);

//   const BtcPrice = useSelector(
//     (state: RootState) => state.general.btc_price_in_dollar
//   );

//   const calculateTotal = (
//     inputValue: number,
//     amount: number,
//     divisibility: number,
//     utxoIndex: number
//   ) => {
//     if (isNaN(inputValue)) {
//       return 0;
//     }

//     const totalAmount = amount / Math.pow(10, divisibility);
//     const total = inputValue * totalAmount;
//     setPrices((prev) => ({ ...prev, [utxoIndex]: total }));
//     return total / 100000000;
//   };

//   const handleInput = (
//     event: React.ChangeEvent<HTMLInputElement>,
//     utxoIndex: number
//   ) => {
//     const value = Number(event.target.value);
//     setInputValues((prev) => ({ ...prev, [utxoIndex]: value }));
//     const totalValue = calculateTotal(
//       value,
//       utxos[utxoIndex]?.rune_amount,
//       utxos[utxoIndex]?.rune_divisibility,
//       utxoIndex
//     );
//     setTotals((prev) => ({ ...prev, [utxoIndex]: totalValue }));
//   };

//   // change type
//   const listItemData = async (details: ITransaction) => {
//     console.log(details, "------bulk list item data details");
//     const response = await createListPsbt(details);
//     if (response?.data) {
//       setUnsignedPsbtBase64(response.data.unsigned_psbt_base64);
//       setlistitems(response?.data);
//     }
//   };

//   const handleListAll = async () => {
//     const itemsDetailsArray = utxos.map((utxo, utxoIndex) => ({
//       price: prices[utxoIndex],
//       utxo_id: utxo?.utxo_id,
//     }));

//     if (
//       walletDetails &&
//       walletDetails.ordinal_address &&
//       walletDetails.wallet
//     ) {
//       const body = {
//         receive_address: walletDetails?.ordinal_address,
//         wallet: walletDetails?.wallet,
//         publickey: walletDetails?.ordinal_pubkey,
//         items: itemsDetailsArray,
//       };
//       setItems(body);
//       await listItemData(body);
//     }
//   };

//   const signTx = useCallback(async () => {
//     if (!walletDetails) {
//       alert("Connect wallet to proceed");
//       return;
//     }

//     let inputs: any = [];
//     Object.entries(inputValues).map((_, idx) => {
//       inputs.push({
//         address: walletDetails.ordinal_address,
//         publickey: walletDetails.ordinal_pubkey,
//         sighash: 131,
//         index: [idx],
//       });
//     });

//     const options: any = {
//       psbt: unsignedPsbtBase64,
//       network: process.env.NEXT_PUBLIC_NETWORK || "Mainnet",
//       action: "sell",
//       inputs,
//     };

//     console.log({ options });

//     await sign(options);
//   }, [action, unsignedPsbtBase64]);

//   useEffect(() => {
//     if (result) {
//       setSignPsbt(result);
//     }

//     if (error) {
//       console.error("Sign Error:", error);
//       alert("Wallet error occurred");
//       setLoading(false);
//     }

//     setLoading(false);
//   }, [result, error]);

//   const sendSignedPsbtAndListItems = async (
//     signedPsbt: string,
//     listItem: RunesResponse | null
//   ) => {
//     if (!signedPsbt || !listItem) return;
//     const listData = {
//       ...items,
//       unsigned_listing_psbt_base64: listItem.unsigned_psbt_base64,
//       tap_internal_key: listItem.tap_internal_key,
//       signed_listing_psbt_base64: signedPsbt,
//     };

//     const response = await listItems(listData);
//     console.log("Response from list item:", response);
//   };

//   useEffect(() => {
//     sendSignedPsbtAndListItems(signPsbt, listItem);
//   }, [signPsbt]);

//   return (
//     <div className="w-full flex flex-col gap-4 p-4 bg-gray-50 rounded-lg shadow-lg text-bla text-customPurple_950">
//       {utxos &&
//         utxos.map((utxo, utxoIndex) => (
//           <div className="w-full flex flex-col" key={utxoIndex}>
//             <div className="w-full border-b-2 py-4 flex flex-wrap items-center justify-between bg-white p-4 rounded-lg shadow-md">
//               <div className="w-1/4 flex flex-col items-start">
//                 <p className="text-sm font-semibold text-gray-700">Rune Name</p>
//                 <p className="text-lg text-left text-gray-900">
//                   {utxo.rune_name}
//                 </p>
//                 <p className="text-sm font-semibold text-gray-700 mt-2">
//                   Amount
//                 </p>
//                 <p className="text-lg text-gray-900">
//                   {formatNumber(
//                     utxo.rune_amount / Math.pow(10, utxo.rune_divisibility)
//                   )}
//                 </p>
//               </div>
//               <div className="w-1/4 flex flex-col justify-between items-start px-4">
//                 <p className="text-sm font-semibold text-gray-700">
//                   Value in BTC
//                 </p>
//                 <p className="text-lg text-gray-900">
//                   {(totals[utxoIndex] || 0).toFixed(2)} BTC
//                 </p>

//                 <p className="text-sm font-semibold text-gray-700 mt-2">
//                   Value in USD
//                 </p>
//                 <p className="text-lg text-gray-900">
//                   {((totals[utxoIndex] || 0) * BtcPrice).toFixed(2)} USD
//                 </p>
//               </div>
//               <div className="w-1/4 flex flex-col items-start px-4">
//                 <p className="text-sm font-semibold text-gray-700">
//                   Input Amount
//                 </p>
//                 <input
//                   type="text"
//                   onChange={(e) => handleInput(e, utxoIndex)}
//                   value={inputValues[utxoIndex] || ""}
//                   className="w-full border border-customPurple_900 bg-transparent rounded outline-none px-3 py-2 mt-1 text-black"
//                 />
//               </div>
//             </div>
//           </div>
//         ))}
//       <div className="w-full flex justify-center mt-4">
//         {!unsignedPsbtBase64 ? (
//           <div className="">
//             <button
//               onClick={handleListAll}
//               className="custom-gradient text-white font-bold py-2 px-4 rounded cursor-pointer"
//             >
//               List All
//             </button>
//           </div>
//         ) : (
//           <button
//             onClick={signTx}
//             className="custom-gradient text-white font-bold py-2 px-4 rounded cursor-pointer"
//           >
//             Sign All
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default RuneUtxos;
