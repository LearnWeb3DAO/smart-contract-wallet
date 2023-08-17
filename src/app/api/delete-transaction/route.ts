import { prisma } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json();

    const response = await prisma.transactionSignature.delete({
      where: {
        id: transactionId,
      },
      include: {
        transaction: true,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error });
  }
}
