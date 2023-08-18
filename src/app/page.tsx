"use client";

import WalletList from "@/components/walletList";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected, address } = useAccount();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;
  return (
    <main className="flex flex-col h-screen">
      <div className="flex flex-col h-full gap-6 justify-center items-center">
        <Fragment>
          <WalletList address={address! as string} />
          {isConnected ? (
            <Link
              href="/create-wallet"
              className="px-4 py-2 bg-blue-500 transition-colors hover:bg-blue-600 rounded-lg"
            >
              Create Wallet
            </Link>
          ) : null}
        </Fragment>
      </div>
    </main>
  );
}
