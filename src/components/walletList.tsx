import { Wallet } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";

type WalletWithTxnsCount = Wallet & {
  _count: {
    transactions: number;
  };
};

export default function WalletList({ address }: { address: string }) {
  const [wallets, setWallets] = useState<WalletWithTxnsCount[]>([]);

  useEffect(() => {
    fetch(`/api/fetch-wallets?address=${address}`)
      .then((response) => response.json())
      .then((data) => setWallets(data));
  }, [address]);

  return (
    <main className="flex flex-col justify-center items-center  gap-5">
      <h1 className="text-5xl font-bold">Your Wallets</h1>

      {wallets.length === 0 ? (
        <div className="flex justify-center items-center border-2 border-dashed p-6 rounded-lg">
          <p className="text-lg">
            You currently have no smart contract wallets.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {wallets.length > 0
            ? wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex flex-col border border-gray-800 rounded-lg"
                >
                  <div className="bg-gray-800 flex gap-4 items-center rounded-t-lg p-2">
                    <Link
                      className="text-gray-300 font-mono"
                      href={`/${wallet.address}`}
                    >
                      {wallet.address}
                    </Link>
                    <p className="text-gray-300">
                      Pending Txns: {wallet._count.transactions}
                    </p>
                    <div className="bg-gray-300 rounded-full items-center px-2 py-1 flex gap-2">
                      {wallet.isDeployed ? (
                        <div className="h-2 w-2 rounded-full bg-green-400" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                      <p className="text-gray-800 text-sm font-medium">
                        {wallet.isDeployed ? "Deployed" : "Not Deployed"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col py-2 divide-y divide-gray-600">
                    {wallet.signers.map((signer, idx) => (
                      <div
                        key={`${signer}-${idx}`}
                        className="px-4 flex items-center justify-center gap-2 py-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-10 h-10"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>

                        <p className="text-gray-300 font-mono">{signer}</p>

                        <Link
                          href="#"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          Etherscan
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : null}
        </div>
      )}
    </main>
  );
}
