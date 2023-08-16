import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { walletFactoryContract } from "@/utils/getWalletFactoryContract";
import { prisma } from "@/utils/db";
import { BigNumber } from "ethers";

export async function POST(req: NextRequest) {
  try {
    const { signers }: { signers: string[] } = await req.json();
    const salt = "0x" + randomBytes(32).toString("hex");

    const walletAddress = await walletFactoryContract.getAddress(signers, salt);

    const response = await prisma.wallet.create({
      data: {
        salt: salt,
        signers: signers.map((s) => s.toLowerCase()),
        isDeployed: false,
        address: walletAddress,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error });
  }
}
