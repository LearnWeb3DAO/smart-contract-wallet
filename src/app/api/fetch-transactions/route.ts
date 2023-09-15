import { prisma } from "@/utils/db";
import { isAddress } from "ethers/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { Transaction, TransactionSignature, Wallet } from "@prisma/client";

export const dynamic = "force-dynamic";
export type TransactionWithSignatures = Transaction & {
  signatures: TransactionSignature[];
  wallet: Wallet;
  pendingSigners: string[];
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      throw new Error("Missing or invalid wallet address");
    }

    if (!isAddress(walletAddress)) {
      throw new Error("Invalid Ethereum address");
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: {
          address: walletAddress,
        },
      },
      include: {
        signatures: true,
        wallet: true,
      },
      orderBy: {
        txHash: {
          sort: "asc",
          nulls: "first",
        },
      },
    });

    const augmentedTransactions: TransactionWithSignatures[] = transactions.map(
      (transaction) => {
        const pendingSigners = transaction.wallet.signers.filter(
          (signer) =>
            !transaction.signatures.find(
              (signature) => signature.signerAddress === signer
            )
        );

        return {
          ...transaction,
          pendingSigners,
        };
      }
    );

    return NextResponse.json({ transactions: augmentedTransactions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error });
  }
}
