import dbConnect from "@/lib/dbconnect";
import { User } from "@/modals";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("*********INSIDE ADD USER API**********");
  try {
    const userDetails = await req.json();
    console.log(userDetails, "-----userDetails");
    await dbConnect();

    // Check if the user already exists
    let existingUser = await User.findOne({
      ordinal_address: userDetails.ordinal_address,
    });
     console.log(existingUser,"---------------existingUser")

    if (existingUser) {
      console.log("---------------existingUser")
      // User already exists, update the existing user's details
      existingUser.set(userDetails); // Update existing user's details
      await existingUser.save();
      return NextResponse.json({ userDetails, message: "User updated" });
    } else {
      // User does not exist, create a new user
      const newUser = new User(userDetails);
      await newUser.save();
      return NextResponse.json({ userDetails, message: "User created" });
    }
  } catch (error) {
    console.log(error, "-----------error");
    return NextResponse.json({ message: "Error processing request" });
  }
}
