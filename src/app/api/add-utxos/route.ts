import dbConnect from "@/lib/dbconnect";
import { RuneUtxo, User } from "@/modals";
import { AddressTxsUtxo, IRune, IUTXOs, RuneDetails } from "@/types";
import { aggregateRuneAmounts, getRunes } from "@/utils/GetRunes";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("************ Post runes to DB and store UTXOs API called *************");
  
  try {
    const walletDetails = await req.json();
    const runesUtxos = await getRunes(walletDetails.ordinal_address);
    
    await dbConnect();
    
    const aggregateRuneAmount = aggregateRuneAmounts(runesUtxos);
    
    const runesToUpdate = aggregateRuneAmount.map(rune => ({
      rune_name: rune.rune_name,
      rune_amount: rune.rune_amount,
      rune_divisibility: rune.rune_divisibility,
      rune_symbol: rune.rune_symbol,
    }));

    for (const rune of runesToUpdate) {
      const query = {
        ordinal_address: walletDetails.ordinal_address,
        "runes.rune_name": { $ne: rune.rune_name },
      };
      const update = { $addToSet: { runes: rune } };

      const result = await User.findOneAndUpdate(query, update, {
        new: true,
        useFindAndModify: false,
      });

      if (result) {
        console.log(`Rune ${rune.rune_name} updated successfully`);
      } else {
        console.log(`Rune ${rune.rune_name} already exists, no update performed`);
      }
    }

    const transformedUtxos = runesUtxos.map((utxo: AddressTxsUtxo) => {
      const runes: IRune[] = Object.entries(utxo.rune || {}).map(([key, value]) => ({
        rune_name: key,
        rune_amount: (value as RuneDetails).amount,
        rune_divisibility: (value as RuneDetails).divisibility,
        rune_symbol: (value as RuneDetails).symbol,
      }));

      const { rune, ...rest } = utxo;
      const [firstRune] = runes;

      return {
        ...rest,
        ...firstRune,
      } as IUTXOs;
    });

  for (const utxo of transformedUtxos) {
  try {
    const existingUtxo = await RuneUtxo.findOne({ utxo_id: utxo.utxo_id });

    if (!existingUtxo) {
      // Insert if the UTXO doesn't exist
      const insertedUtxo = await RuneUtxo.create(utxo);
      console.log("Rune UTXO saved successfully", insertedUtxo);
    } else {
      console.log("Rune UTXO already exists, skipping insertion");
    }
  } catch (error) {
    console.error("Error saving Rune UTXO:", error);
  }
}

// Respond based on the operation outcome
if (transformedUtxos.length > 0) {
  return NextResponse.json({
    success: true,
    message: "Data received and processed successfully.",
  });
} else {
  return NextResponse.json({
    success: false,
    message: "No UTXOs to save.",
  });
}
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({
      success: false,
      message: "Error processing request. Please try again later.",
    });
  }
}
