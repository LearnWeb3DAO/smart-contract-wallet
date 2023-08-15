import { prisma } from "@/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, userOp, signerAddress, signature } =
      await req.json();

    console.log({
      walletAddress,
      userOp,
      signerAddress,
      signature,
    });

    const wallet = await prisma.wallet.findUnique({
      where: {
        address: walletAddress,
      },
    });

    if (!wallet) throw new Error("Invalid walletAddress");

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        userOp,
        signatures: {
          create: {
            signature,
            signerAddress: signerAddress.toLowerCase(),
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error });
  }
}
