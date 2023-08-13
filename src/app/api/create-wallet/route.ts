import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { walletFactoryContract } from "@/utils/getWalletFactoryContract";
import { prisma } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const { signers } = await req.json();
    const random256Bits = randomBytes(32);

    const salt = BigInt(`0x${random256Bits.toString("hex")}`);

    console.log({
      signers,
      salt,
    });

    const walletAddress = await walletFactoryContract.read.getAddress([
      signers,
      salt,
    ]);

    const response = await prisma.wallet.create({
      data: {
        salt: salt.toString(),
        signers: signers,
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
