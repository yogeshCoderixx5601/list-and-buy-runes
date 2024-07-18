// set runes in [runes] based on the ordinal address in user collection
import dbConnect from "@/lib/dbconnect";
import { RuneUtxo, User } from "@/modals";
import { IRune, IUTXOs } from "@/types";
import { aggregateRuneAmounts, getRunes } from "@/utils/GetRunes";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log(
    "************post runes to db for user and store utxos api called *************"
  );
  try {
    const walletDetails = await req.json();
    // console.log(walletDetails, "wallet details");

    const runesUtxos = await getRunes(walletDetails.ordinal_address);

   const aggregateRuneAmount = aggregateRuneAmounts(runesUtxos);

await dbConnect();

const runes = aggregateRuneAmount.map(
  (rune: {
    rune_name: string;
    rune_amount: number;
    rune_divisibility: string;
    rune_symbol: string;
  }) => ({
    rune_name: rune.rune_name,
    rune_amount: rune.rune_amount,
    rune_divisibility: rune.rune_divisibility, 
    rune_symbol: rune.rune_symbol, 
  })
);

    for (const rune of runes) {
      const query = {
        ordinal_address: walletDetails.ordinal_address,
        "runes.name": { $ne: rune.rune_name },
      };
      const update = { $addToSet: { runes: rune } };

      // updating user with runes
      const result = await User.findOneAndUpdate(query, update, {
        new: true,
        useFindAndModify: false,
      });

      if (result) {
        // `Rune ${rune.name} already exists, no update performed`
        console.log(`Rune updated successfully`);
      } else {
        console.log(`Rune ${rune.rune_name} already exists, no update performed`);
        // throw new Error(`Rune ${rune.name} already exists, no update performed`)
      }
    }

    const transformedUtxos = runesUtxos.map((utxo: IUTXOs) => {
        console.log(utxo, "inside transfered utxos")
      const runes: IRune[] = Object.entries(utxo.rune || {}).map(
        ([key, value]) => {
          // Explicitly type the value
          const runeValue = value as {
            rune_name: string;
            amount: number;
            divisibility: number;
            symbol: string;
          };
          return {
            rune_name: key,
            rune_amount: runeValue.amount,
            rune_divisibility: runeValue.divisibility,
            rune_symbol: runeValue.symbol,
          };
        }
      );
      console.log(runes, "runes");
      const { rune, ...rest } = utxo;

      // Assuming there is only one rune in each utxo.rune object
      const [firstRune] = runes;

      return {
        ...rest,
        ...firstRune,
      };
    });
    console.log(transformedUtxos, "------transformedUtxos");

    // create new doc in utxoModal
    if (transformedUtxos) {
      try {
        const utxos = await RuneUtxo.insertMany(transformedUtxos, {
          ordered: false,
        });
        console.log("Runes UTXOs saved successfully", utxos);
        return NextResponse.json({
          success: true,
          message: "Data received and processed successfully.",
        });
      } catch (error) {
        console.error("Error saving UTXOs:", error);
        return NextResponse.json({
          success: false,
          message: "Error saving UTXOs. Please try again later.",
        });
      }
    }
  } catch (error) {
    console.error("Error :", error);
    return NextResponse.json({ error: "Error " }, { status: 500 });
  }
}
