import { Wallet } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./icon";
import Button from "./button";

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
    <main className="flex flex-col justify-center items-center gap-5">
      <h1 className="text-5xl font-bold">Your Wallets</h1>

      {wallets.length === 0 ? (
        <div className="flex justify-center items-center border-2 border-dashed p-6 rounded-lg">
          <p className="text-lg">
            You currently have no smart contract wallets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {wallets.length > 0 &&
            wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="flex flex-col border border-gray-800 rounded-lg"
              >
                <Link
                  className="text-gray-300 font-medium"
                  href={`/${wallet.address}`}
                >
                  <div className="bg-gray-800 flex justify-between gap-4 items-center rounded-t-lg p-2 font-mono">
                    {wallet.address}
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
                </Link>

                <div className="flex flex-col py-2 divide-y divide-gray-600">
                  {wallet.signers.length > 0 &&
                    wallet.signers.map((signer, idx) => (
                      <div
                        key={`${wallet.address}-${signer}`}
                        className="px-4 flex items-center justify-center gap-2 py-2"
                      >
                        <Icon type="user" />
                        <p className="text-gray-300 font-mono">{signer}</p>
                        <Link
                          href={`https://goerli.etherscan.io/address/${signer}`}
                          target="_blank"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          Etherscan
                        </Link>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </main>
  );
}
