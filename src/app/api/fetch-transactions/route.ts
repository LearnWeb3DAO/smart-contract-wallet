import { prisma } from "@/utils/db";
import { isAddress } from "ethers/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get("userAddress");
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      throw new Error("Missing or invalid wallet address");
    }

    if (!userAddress) {
      throw new Error("Missing or invalid address");
    }

    if (!isAddress(userAddress)) {
      throw new Error("Invalid Ethereum address");
    }

    if (!isAddress(walletAddress)) {
      throw new Error("Invalid Ethereum address");
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: {
          signers: {
            hasEvery: [userAddress.toLowerCase()],
          },
          address: walletAddress,
        },
      },
      include: {
        signatures: true,
        wallet: true,
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error });
  }
}
