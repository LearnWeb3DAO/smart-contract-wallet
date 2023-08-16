import { BUNDLER_RPC_URL } from "@/utils/constants";
import getUserOpHash from "@/utils/getUserOpHash";
import { RPC_URL, provider } from "@/utils/getWalletFactoryContract";
import {
  Prisma,
  Transaction,
  TransactionSignature,
  Wallet,
} from "@prisma/client";
import { sign } from "crypto";
import { BigNumber } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";
import { useEffect, useState } from "react";
import { Client, IUserOperation, Presets, UserOperationBuilder } from "userop";
import { useWalletClient } from "wagmi";

type TransactionsWithSignatures = {
  wallet: {
    id: number;
    address: string;
    signers: string[];
    isDeployed: boolean;
    salt: string;
  };
  signatures: {
    id: number;
    transactionId: number;
    signerAddress: string;
    signature: string;
  }[];
} & {
  id: number;
  walletId: number;
  txHash: string | null;
  userOp: Prisma.JsonValue;
};

export default function TransactionsList({
  address,
  walletAdderss,
}: {
  address: string;
  walletAdderss: string;
}) {
  const [transactionsToSend, setTransactionsToSend] = useState<
    TransactionsWithSignatures[]
  >([]);
  const [transactionsToSign, setTransactionsToSign] = useState<
    TransactionsWithSignatures[]
  >([]);

  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    fetch(
      `api/fetch-transactions?userAddress=${address}&walletAddress=${walletAdderss}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        if (data.transactions && data.transactions.length > 0) {
          // transactions that user has to sign
          const transactions: TransactionsWithSignatures[] = data.transactions;

          for (let transaction of transactions) {
            if (
              transaction.wallet.signers.length ===
                transaction.signatures.length &&
              !(
                transactionsToSend.filter((tx) => tx.id === transaction.id)
                  .length > 0
              )
            ) {
              setTransactionsToSend([...transactionsToSend, transaction]);
            } else {
              if (
                transaction.signatures.filter(
                  (signature) =>
                    signature.signerAddress === address.toLowerCase()
                ).length === 0 &&
                !(
                  transactionsToSign.filter((tx) => tx.id === transaction.id)
                    .length > 0
                )
              ) {
                setTransactionsToSign([...transactionsToSign, transaction]);
              }
            }
          }
        }
      });
  }, [address, transactionsToSend, transactionsToSign, walletAdderss]);

  const signTransaction = async (transaction: TransactionsWithSignatures) => {
    try {
      const signedUserOpHash = await getUserOpHash(
        transaction.userOp as unknown as IUserOperation
      );
      const signature = await walletClient?.signMessage({
        message: { raw: signedUserOpHash as `0x${string}` },
      });

      const response = await fetch("/api/create-signature", {
        method: "POST",
        body: JSON.stringify({
          signerAddress: address,
          signature,
          transactionId: transaction.id,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setTransactionsToSign(
        transactionsToSign.filter((tx) => tx.id !== transaction.id)
      );
      window.alert("Transaction signed successfully");
    } catch (e) {
      console.error(e);
    }
  };

  const sendTransaction = async (transaction: TransactionsWithSignatures) => {
    try {
      const userOp = transaction.userOp as unknown as IUserOperation;
      const client = await Client.init(BUNDLER_RPC_URL);
      const signatures = transaction.signatures.map((signature) => {
        return signature.signature;
      });
      const encodedSignatures = defaultAbiCoder.encode(
        ["bytes[]"],
        [signatures]
      );
      const builder = new UserOperationBuilder()
        .useDefaults({
          preVerificationGas: 60_000,
          callGasLimit: 100_000,
          verificationGasLimit: 2_000_000,
        })
        .setSender(userOp.sender)
        .setNonce(userOp.nonce)
        .setInitCode(
          BigNumber.from(userOp.nonce).isZero() ? userOp.initCode : "0x"
        )
        .setSignature(encodedSignatures)
        .setCallData(userOp.callData)
        .setMaxFeePerGas(userOp.maxFeePerGas)
        .setMaxPriorityFeePerGas(userOp.maxPriorityFeePerGas);

      const result = await client.sendUserOperation(builder);
      await result.wait();
      window.alert("Transaction sent successfully");
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <main className="flex flex-col justify-center p-10 items-center  gap-5">
      <h1 className="text-5xl font-bold">Transactions</h1>

      {transactionsToSend.length === 0 && transactionsToSign.length === 0 && (
        <div className="flex justify-center items-center border-2 border-dashed p-6 rounded-lg">
          <p className="text-lg">You currently have no transactions.</p>
        </div>
      )}
      {transactionsToSend.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Transactions to Send</h2>
          {transactionsToSend.map((transaction) => (
            <div
              key={transaction.id}
              className="flex flex-col border border-gray-800 rounded-lg justify-center items-center gap-2 p-2"
            >
              Transaction# {transaction.id}
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4  rounded"
                onClick={() => sendTransaction(transaction)}
              >
                Send
              </button>
            </div>
          ))}
        </div>
      )}

      {transactionsToSign.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Transactions to Sign</h2>
          {transactionsToSign.map((transaction) => (
            <div
              key={transaction.id}
              className="flex flex-col border border-gray-800 rounded-lg justify-center items-center gap-2 p-2"
            >
              Transaction# {transaction.id}
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4  rounded"
                onClick={() => signTransaction(transaction)}
              >
                Sign
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
