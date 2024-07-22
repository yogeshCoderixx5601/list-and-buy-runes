"use client";
import React, { useCallback, useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { getListedUtxos } from "@/apiHelper/getListedUtxos";
import RuneTableFooter from "@/components/CustomElements/BuyRunesCard";
import RuneTableRow from "@/components/CustomElements/SingleRuneUtxos";
import { Utxo } from "@/types";



const SingleRunePage = ({ rune_name }: { rune_name: string }) => {
  const [runeUtxos, setRuneUtxos] = useState<Utxo[]>();
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRunes, setSelectedRunes] = useState<Utxo[]>([]);

  const fetchRuneUtxos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getListedUtxos({ rune_name:rune_name, listed:true,in_memepool:false });
      if (response?.data?.result) {
        setRuneUtxos(response.data.result);
      }
    } catch (error) {
      console.error("Error fetching rune UTXOs:", error);
    } finally {
      setLoading(false);
    }
  }, [rune_name]);

  useEffect(() => {
    fetchRuneUtxos();
  }, [fetchRuneUtxos]);



  const handleRuneSelection = (utxo: Utxo) => {
    setSelectedRunes((prevSelected) => {
      if (prevSelected.includes(utxo)) {
        return prevSelected.filter((item) => item !== utxo);
      } else {
        return [...prevSelected, utxo];
      }
    });
  };

  if (loading) {
    return (
      <div className="text-white flex items-center justify-center h-screen">
        <CircularProgress color="inherit" className="sm:w-20 md:w-60" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-4/12 min-h-[80vh] bg-customPurple_950 px-3 py-6 rounded relative">
        <div className="overflow-auto max-h-[60vh]">
          <table className="min-w-full">
            {/* Heading Section */}
            <thead>
              <tr className="border-b-[0.5px]">
                <th className="text-white text-sm font-semibold p-2 text-left">
                  Quantity
                </th>
                <th className="text-white text-sm font-semibold p-2 text-right">
                  Total Amount
                </th>
                <th className="text-white text-sm font-semibold p-2 text-right">
                  Price (sats/unit)
                </th>
                <th className="text-white text-sm font-semibold p-2 text-right">
                  Total (BTC)
                </th>
              </tr>
            </thead>
            {/* Values Section */}
            <tbody>
              {runeUtxos?.map((utxo, idx) => (
                <RuneTableRow
                  key={idx}
                  utxo={utxo}
                  isChecked={selectedRunes.includes(utxo)}
                  onCheckboxChange={() => handleRuneSelection(utxo)}
                />
              ))}
            </tbody>
          </table>
        </div>
          <RuneTableFooter selectedRunes={selectedRunes} />
      </div>
    </div>
  );
};

export default SingleRunePage;
