import React from "react";
import { Utxo } from "@/types";
import { formatNumber } from "@/utils";

interface UtxoItemProps {
  utxo: Utxo;
  utxoIndex: number;
  inputValue: number;
  total: number;
  btcPrice: number;
  handleInput: (event: React.ChangeEvent<HTMLInputElement>, utxoIndex: number) => void;
}

const UtxoItem: React.FC<UtxoItemProps> = ({ utxo, utxoIndex, inputValue, total, btcPrice, handleInput }) => {
  return (
    <div className="w-full flex flex-col">
      <div className="w-full border-b-2 py-4 flex flex-wrap items-center justify-between bg-white p-4 rounded-lg shadow-md">
        <div className="w-1/4 flex flex-col items-start">
          <p className="text-sm font-semibold text-gray-700">Rune Name</p>
          <p className="text-lg text-left text-gray-900">{utxo.rune_name}</p>
          <p className="text-sm font-semibold text-gray-700 mt-2">Amount</p>
          <p className="text-lg text-gray-900">
            {formatNumber(utxo.rune_amount / Math.pow(10, utxo.rune_divisibility))}
          </p>
        </div>
        <div className="w-1/4 flex flex-col justify-between items-start px-4">
          <p className="text-sm font-semibold text-gray-700">Value in BTC</p>
          <p className="text-lg text-gray-900">{(total || 0).toFixed(2)} BTC</p>

          <p className="text-sm font-semibold text-gray-700 mt-2">Value in USD</p>
          <p className="text-lg text-gray-900">{((total || 0) * btcPrice).toFixed(2)} USD</p>
        </div>
        <div className="w-1/4 flex flex-col items-start px-4">
          <p className="text-sm font-semibold text-gray-700">Input Amount</p>
          <input
            type="text"
            onChange={(e) => handleInput(e, utxoIndex)}
            value={inputValue || ""}
            className="w-full border border-customPurple_900 bg-transparent rounded outline-none px-3 py-2 mt-1 text-black"
          />
        </div>
      </div>
    </div>
  );
};

export default UtxoItem;
