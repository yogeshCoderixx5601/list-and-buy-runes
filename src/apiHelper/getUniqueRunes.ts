"use server";
import axios from "axios";

export interface IRuneInfo {
  total_amount: number;
  total_utxos: number;
  rune_name: string;
  rune_symbol: string;
  rune_divisibility: number;
  listed_price_per_token: number;
}

interface UserResponse {
  success: boolean;
  message: string;
  result: IRuneInfo[];
}

export async function getUniqueRunes(
): Promise<{ data?: UserResponse; error: string | null } | undefined> {
  try {

    let url = `${process.env.NEXT_PUBLIC_URL}/api/runes`;
    const response = await axios.get(url)

    if (response.status === 200) {
      return { data: response.data, error: null };
    } else {
      // You might want to customize this message or extract more specific info from the response
      return { error: `Request failed with status code: ${response.status}` };
    }
  } catch (error:any) {
    // Assuming error is of type any. You might want to add more specific type handling
    return { error: error?.message || "An unknown error occurred" };
  }
}

