import { BUNDLER_RPC_URL } from "@/utils/constants";
import { getBuilder } from "@/utils/getBuilder";
import getUserOpHash from "@/utils/getUserOpHash";
import { Prisma } from "@prisma/client";
import { BigNumber } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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

      const signatures: string[] = [];

      transaction.wallet.signers.forEach((signer) => {
        transaction.signatures.forEach((signature) => {
          if (signature.signerAddress === signer) {
            console.log("I came here");
            signatures.push(signature.signature);
          }
        });
      });

      if (signatures.length != transaction.wallet.signers.length)
        throw new Error("Fewer signatures received than expected");

      const builder = await getBuilder(
        userOp.sender,
        BigNumber.from(userOp.nonce),
        userOp.initCode as Uint8Array,
        userOp.callData.toString(),
        signatures,
        transaction.wallet.isDeployed
      );

      builder
        .setMaxFeePerGas(userOp.maxFeePerGas)
        .setMaxPriorityFeePerGas(userOp.maxPriorityFeePerGas);

      const result = await client.sendUserOperation(builder);
      const finalUserOpResult = await result.wait();
      const txHashReciept = await finalUserOpResult?.getTransactionReceipt();

      const txHash = txHashReciept?.transactionHash;

      // mark the wallet as deployed
      const response2 = await fetch("/api/update-wallet-deployed", {
        method: "POST",
        body: JSON.stringify({
          walletId: transaction.wallet.id,
          transactionId: transaction.id,
          txHash,
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
      window.location.reload();
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
                  onClick={() => {
                    if (transaction.txHash) {
                      router.push(
                        `https://goerli.etherscan.io/tx/${transaction.txHash}`
                      );
                    } else {
                      sendTransaction(transaction);
                    }
                  }}
                >
                  {transaction.txHash ? "View Txn" : "Send"}
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
              <div className="flex flex-col gap-2">
                {transaction.wallet.signers.map(
                  (signer) =>
                    transaction.signatures.filter(
                      (signature) =>
                        signature.signerAddress.toLowerCase() ===
                        signer.toLowerCase()
                    ).length > 0 && (
                      // eslint-disable-next-line react/jsx-key
                      <div className="flex  gap-2">
                        <p className="text-lg text-yellow-50">
                          Signer: {signer}
                        </p>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          className="w-6 h-6 text-green-500"
                          key={signer}
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                          />
                        </svg>
                      </div>
                    )
                )}
              </div>
              <div className="flex flex-col gap-2">
                {transaction.wallet.signers.map(
                  (signer) =>
                    transaction.signatures.filter(
                      (signature) =>
                        signature.signerAddress.toLowerCase() ===
                        signer.toLowerCase()
                    ).length === 0 && (
                      // eslint-disable-next-line react/jsx-key
                      <div className="flex  gap-2">
                        <p className="text-lg text-yellow-50">
                          Signer: {signer}
                        </p>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          className="w-6 h-6 text-red-500"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    )
                )}
              </div>
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
