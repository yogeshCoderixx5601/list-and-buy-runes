"use server";
import { Utxo } from "@/types";
// import { IBuyRunes } from "@/types";
import axios from "axios";

interface IResult {
  rune_name:string;
  address:string;
}
interface UserResponse {
  success: boolean;
  message: string;
  result: Utxo[];
}

export async function getUtxos(
    params: { address: string; rune_name: string }
): Promise<{ data?: UserResponse; error: string | null } | undefined> {
  try {
    let url = `${process.env.NEXT_PUBLIC_URL}/api/get-utxos`;
    const response = await axios.get(url, {
      params
    });

    if (response.status === 200) {
      return { data: response.data, error: null };
    } else {
      // You might want to customize this message or extract more specific info from the response
      return { error: `Request failed with status code: ${response.status}` };
    }
  } catch (error:any) {
    return { error: error?.message || "An unknown error occurred" };
  }
}
