import { prisma } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { signature, signerAddress, transactionId } = await req.json();

    await prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
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
