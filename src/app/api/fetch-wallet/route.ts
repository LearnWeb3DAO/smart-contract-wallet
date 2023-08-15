import { prisma } from "@/db";
import { isAddress } from "ethers/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      throw new Error("Missing or invalid address");
    }

    if (!isAddress(walletAddress)) {
      throw new Error("Invalid Ethereum address");
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        address: walletAddress,
      },
    });

    console.log(`wallet is ${wallet}`);
    return NextResponse.json(wallet);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error });
  }
}
