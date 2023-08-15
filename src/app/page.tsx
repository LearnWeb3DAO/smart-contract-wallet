"use client";

import WalletList from "@/components/walletList";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { Fragment } from "react";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected, address } = useAccount();

  return (
    <main className="flex flex-col h-screen">
      <div className="flex justify-end p-2">
        <ConnectButton />
      </div>
      {isConnected && (
        <div className="flex flex-col h-full gap-6 justify-center items-center">
          <Fragment>
            <WalletList address={address! as string} />
            <Link
              href="/create-wallet"
              className="px-4 py-2 bg-blue-500 transition-colors hover:bg-blue-600 rounded-lg"
            >
              Create Wallet
            </Link>
          </Fragment>
        </div>
      )}
    </main>
  );
}
