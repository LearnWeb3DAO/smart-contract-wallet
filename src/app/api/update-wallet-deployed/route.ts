import { prisma } from "@/utils/db";
import { NextApiRequest } from "next";
import { NextResponse } from "next/server";

export async function PUT(req: NextApiRequest) {
  try {
    const { walletId } = await req.body;
    const response = await prisma.wallet.update({
      where: {
        id: walletId,
      },
      data: {
        isDeployed: true,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error });
  }
}
