import { BUNDLER_RPC_URL } from "@/utils/constants";
import { getBuilder } from "@/utils/getBuilder";
import getUserOpHash from "@/utils/getUserOpHash";
import { Prisma } from "@prisma/client";
import { BigNumber } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";
import { useEffect, useState } from "react";
import { Client, IUserOperation, UserOperationBuilder } from "userop";
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch(
          `api/fetch-transactions?userAddress=${address}&walletAddress=${walletAdderss}`
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        if (data.transactions && data.transactions.length > 0) {
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
      } catch (e) {
        console.log(e);
        if (e instanceof Error) {
          window.alert(e.message);
        }
      }
    }
    fetchTransactions();
  }, [address, transactionsToSend, transactionsToSign, walletAdderss]);

  const signTransaction = async (transaction: TransactionsWithSignatures) => {
    try {
      setLoading(true);
      const signedUserOpHash = await getUserOpHash(
        transaction.userOp as unknown as IUserOperation
      );
      const signature = await walletClient?.signMessage({
        message: { raw: signedUserOpHash as `0x${string}` },
      });

      const response = await fetch("/api/create-signature", {
        method: "DELETE",
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
      window.location.reload();
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        window.alert(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendTransaction = async (transaction: TransactionsWithSignatures) => {
    try {
      setLoading(true);
      const userOp = transaction.userOp as unknown as IUserOperation;
      const client = await Client.init(BUNDLER_RPC_URL);

      const signatures = transaction.signatures.map((signature) => {
        return signature.signature;
      });

      const builder = await getBuilder(
        userOp.sender,
        BigNumber.from(userOp.nonce),
        userOp.initCode as Uint8Array,
        userOp.callData.toString(),
        signatures
      );

      builder
        .setMaxFeePerGas(userOp.maxFeePerGas)
        .setMaxPriorityFeePerGas(userOp.maxPriorityFeePerGas);

      const result = await client.sendUserOperation(builder);
      await result.wait();

      // delete transaction from db
      const response = await fetch("/api/delete-transaction", {
        method: "DELETE",
        body: JSON.stringify({
          transactionId: transaction.id,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // mark the wallet as deployed
      const response2 = await fetch("/api/update-wallet-deployed", {
        method: "PUT",
        body: JSON.stringify({
          walletId: transaction.wallet.id,
        }),
      });
      const data2 = await response2.json();
      if (data2.error) throw new Error(data2.error);

      window.alert("Transaction sent successfully");
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        window.alert(e.message);
      }
    } finally {
      setLoading(false);
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
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white-1"></div>
                </div>
              ) : (
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4  rounded"
                  onClick={() => sendTransaction(transaction)}
                >
                  Send
                </button>
              )}
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
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white-1"></div>
                </div>
              ) : (
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4  rounded"
                  onClick={() => signTransaction(transaction)}
                >
                  Sign
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
