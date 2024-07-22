import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { useSignTx, useWalletAddress } from "bitcoin-wallet-adapter";
import mempoolJS from "@mempool/mempool.js";
import { useRouter } from "next/navigation";
import { setNewActivity } from "@/stores/reducers/generalReducer";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import { Utxo } from "@/types";
import { buyRunes } from "@/apiHelper/buyRunes";

interface Props {
  selectedRunes: Utxo[];
  totalRunePriceUSD: number;
}

const BuyRuneButton: React.FC<Props> = ({
  selectedRunes,
  totalRunePriceUSD,
}) => {
  const dispatch = useDispatch();
  const walletDetails = useWalletAddress();
  const router = useRouter();
  const [action, setAction] = useState<string>("");
  const { loading: signLoading, result, error, signTx: sign } = useSignTx();
  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
  const [inputLength, setInputLength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMap, setLoadingMap] = useState<{ [key: string]: boolean }>({});
  const [errorMap, setErrorMap] = useState<{ [key: string]: string | null }>(
    {}
  );
  const [feeRate, setFeeRate] = useState(0);

  const fee = async () => {
    const {
      bitcoin: { fees },
    } = mempoolJS({
      hostname: "mempool.space",
      network: "testnet",
    });
    const feesRecommended = await fees.getFeesRecommended();
    setFeeRate(feesRecommended.fastestFee + 10);
    console.log(feesRecommended);
  };

  useEffect(() => {
    fee();
  }, []);
  const handleBuyRunes = async () => {
    if (selectedRunes.length === 0) {
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "No runes selected",
          open: true,
          severity: "warning",
        })
      );
      return;
    }

    setLoading(true);
    setErrorMap({});
    setLoadingMap({});
    try {
      const runesDetailsArray = selectedRunes.map((rune) => ({
        utxo_id: rune.utxo_id,
        price: rune.listed_price,
      }));
      if (
        walletDetails &&
        walletDetails.ordinal_address &&
        walletDetails.wallet
      ) {
        const body = {
          pay_address: walletDetails?.cardinal_address,
          receive_address: walletDetails?.ordinal_address,
          publickey: walletDetails?.cardinal_pubkey,
          wallet: walletDetails?.wallet,
          fee_rate: feeRate,
          items: runesDetailsArray,
        };

        console.log({ body });

        const response = await buyRunes(body);

        if (response?.data?.result) {
          console.log(
            response?.data?.result.unsigned_psbt_base64,
            "----------------response bulk buy"
          );
          setAction("buy");
          setInputLength(response?.data?.result.input_length);
          setUnsignedPsbtBase64(
            response?.data?.result.unsigned_psbt_base64 || ""
          );
        }
      }
    } catch (error:any) {
      selectedRunes.forEach((rune: Utxo) => {
        setErrorMap((prevErrorMap) => ({
          ...prevErrorMap,
          [rune._id]: error.message || "An error occurred",
        }));
      });
    } finally {
      setLoading(false);
    }
  };

  const signTx = useCallback(async () => {
    if (!walletDetails) {
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Connect wallet to proceed",
          open: true,
          severity: "warning",
        })
      );
      return;
    }
    let inputs = [];
    console.log({ action });
    if (action === "dummy") {
      inputs.push({
        address: walletDetails.cardinal_address,
        publickey: walletDetails.cardinal_pubkey,
        sighash: 131,
        index: [0],
      });
    } else if (action === "buy") {
      console.log({ inputLength });
      new Array(inputLength).fill(1).map((item: number, idx: number) => {
        console.log({ selectedRunes });
        if (idx === 0 || idx > selectedRunes.length)
          inputs.push({
            address: walletDetails.cardinal_address,
            publickey: walletDetails.cardinal_pubkey,
            sighash: 1,
            index: [idx],
          });
      });
    }
    const options: any = {
      psbt: unsignedPsbtBase64,
      network: "testnet",
      action,
      inputs,
    };
    console.log(options, "OPTIONS");

    await sign(options);
  }, [action, unsignedPsbtBase64]);

  useEffect(() => {
    if (unsignedPsbtBase64) {
      signTx();
    }
  }, [unsignedPsbtBase64]);

  console.log("Sign Result:", result);

  const broadcast = async (signedPsbt: string) => {
    console.log(signedPsbt, "-----------------signedPsbt");
    try {
      const { data } = await axios.post("/api/broadcast", {
        signed_psbt: signedPsbt,
        activity_tag: action === "dummy" ? "prepare" : "buy",
        user_address: walletDetails?.cardinal_address,
      });
      setLoading(false);

      dispatch(setNewActivity(true));
      window.open(
        `https://mempool.space/${
          process.env.NEXT_PUBLIC_NETWORK === "testnet" ? "testnet/" : ""
        }tx/${data.data.txid}`,
        "_blank"
      );
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: `Broadcasted ${action} Tx Successfully`,
          open: true,
          severity: "success",
        })
      );
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: `Txid: ${data.data.txid}`,
          open: true,
          severity: "success",
        })
      );

      router.refresh();
    } catch (err:any) {
      setLoading(false);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: err.response.data.message || "Error broadcasting tx",
          open: true,
          severity: "error",
        })
      );
    }
  };

  useEffect(() => {
    if (result) {
      console.log("Sign Result:", result);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Tx signed successfully",
          open: true,
          severity: "success",
        })
      );

      if (result) {
        broadcast(result);
      }
    }

    if (error) {
      console.error("Sign Error:", error);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: error || "Error signing tx",
          open: true,
          severity: "error",
        })
      );
    }
  }, [result, error]);
  return (
    <button
      onClick={handleBuyRunes}
      className={`py-2 px-4 rounded mt-2 ${
        totalRunePriceUSD >= 1
          ? "custom-gradient text-white"
          : "bg-transparent border border-customPurple_950 text-customPurple_950 hover:cursor-not-allowed"
      }`}
      disabled={totalRunePriceUSD < 1}
    >
      {loading ? (
        <CircularProgress size={20} color="secondary" />
      ) : selectedRunes.length >= 1 ? (
        `Buy ${selectedRunes.length}`
      ) : (
        "Select Rune to Buy"
      )}
    </button>
  );
};

export default BuyRuneButton;
