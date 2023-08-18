import { prisma } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { walletId, transactionId, txHash } = await req.json();
    console.log(`walletId: ${walletId}`);
    console.log(`transactionId: ${transactionId}`);
    console.log(`txHash: ${txHash}`);
    await prisma.wallet.update({
      where: {
        id: walletId,
      },
      data: {
        isDeployed: true,
      },
    });

    const res = await prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        txHash,
      },
    });
    return NextResponse.json(res);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error });
  }
}
