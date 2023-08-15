import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { walletFactoryContract } from "@/utils/getWalletFactoryContract";
import { prisma } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const { signers }: { signers: string[] } = await req.json();
    const random256Bits = randomBytes(32);

    const salt = BigInt(`0x${random256Bits.toString("hex")}`);

    const walletAddress = await walletFactoryContract.getFunction("getAddress")(
      signers,
      salt
    );

    const response = await prisma.wallet.create({
      data: {
        salt: salt.toString(),
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
