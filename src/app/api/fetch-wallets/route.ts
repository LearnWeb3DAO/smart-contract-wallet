import { prisma } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
      throw new Error("Missing or invalid address");
    }

    if (!isAddress(address)) {
      throw new Error("Invalid Ethereum address");
    }

    const wallets = await prisma.wallet.findMany({
      where: {
        signers: {
          has: address,
        },
      },
      include: {
        _count: {
          select: {
            transactions: {
              where: {
                txHash: {
                  not: null,
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(wallets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error });
  }
}
