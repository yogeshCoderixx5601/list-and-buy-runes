"use server";
import { ITransaction } from "@/types";
import axios from "axios";

interface IResult {
  unsigned_psbt_base64: string;
  input_length: number;
  utxo_id: string;
  receive_address: string;
  pay_address: string;
  for: string; // Assuming 'for' is a string, adjust if it's a different type
}

interface BuyRunesResponse {
  ok: boolean;
  result: IResult;
}


export async function buyRunes(
  body: ITransaction
): Promise<{ data?: BuyRunesResponse; error: string | null } | undefined> {
  try {
    let url = `${process.env.NEXT_PUBLIC_URL}/api/create-buying-psbt`;
    const response = await axios.post(url, body);

    if (response.status === 200) {
      return { data: response.data, error: null };
    } else {
      return { error: `Request failed with status code: ${response.status}` };
    }
  } catch (error:any) {
    console.error("Error in bulkbuyRunes:", error);
    return { error: error?.message || "An unknown error occurred" };
  }
}
