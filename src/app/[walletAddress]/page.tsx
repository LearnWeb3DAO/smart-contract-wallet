"use client";
import TransactionsList from "@/components/transactionList";
import { getUserOpForETHTransfer } from "@/utils/getUserOpFromETHTransfer";
import getUserOpHash from "@/utils/getUserOpHash";
import { parseEther } from "ethers/lib/utils";
import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";

export default function WalletPage({
  params: { walletAddress: walletAddress },
}: {
  params: { walletAddress: string };
}) {
  const { address: userAddress } = useAccount();

  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const { data: walletClient } = useWalletClient();

  const fetchUserOp = async () => {
    try {
      const response = await fetch(
        `/api/fetch-wallet?walletAddress=${walletAddress}`
      );
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const amountBigInt = parseEther(amount.toString());
      const userOp = await getUserOpForETHTransfer(
        walletAddress,
        data.signers,
        data.salt,
        toAddress,
        amountBigInt
      );

      if (!userOp) throw new Error("Could not get user operation");

      return userOp;
    } catch (e: any) {
      throw new Error(e.message);
    }
  };

  const createTransaction = async () => {
    try {
      if (!userAddress) return;
      const userOp = await fetchUserOp();

      if (!userOp) throw new Error("Could not fetch userOp");
      const signedUserOpHash = await getUserOpHash(userOp);
      const signature = await walletClient?.signMessage({
        message: { raw: signedUserOpHash as `0x${string}` },
      });

      const response = await fetch("/api/create-transaction", {
        method: "POST",
        body: JSON.stringify({
          walletAddress,
          userOp,
          signature,
          signerAddress: userAddress,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      window.alert("Transaction created!");
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="flex flex-col justify-center items-center h-screen gap-5">
      <h1 className="text-xl p-2">Wallet: {walletAddress}</h1>
      <input
        className="text-lg text-black rounded-md p-1"
        placeholder="0x0"
        onChange={(e) => setToAddress(e.target.value)}
      />
      <input
        className="text-lg text-black rounded-md p-1"
        type="number"
        placeholder="1"
        onChange={(e) => {
          if (e.target.value === "") {
            setAmount(0);
            return;
          }

          setAmount(parseFloat(e.target.value));
        }}
      />

      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl"
        onClick={createTransaction}
      >
        Create Transaction
      </button>

      <TransactionsList
        address={userAddress! as string}
        walletAdderss={walletAddress as string}
      />
    </div>
  );
}
