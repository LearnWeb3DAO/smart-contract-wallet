"use client";

import WalletList from "@/components/walletList";
import { useIsMounted } from "@/hooks/useIsMounted";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { useAccount } from "wagmi";

export const dynamic = "force-dynamic";

export default function Home() {
  const { isConnected, address } = useAccount();
  const isMounted = useIsMounted();

  if (!isMounted) return null;

  return (
    <main className="flex flex-col py-6">
      <div className="flex flex-col h-full gap-6 justify-center items-center">
        <Fragment>
          {isConnected && (
            <Link
              href="/create-wallet"
              className="px-4 py-2 bg-blue-500 transition-colors hover:bg-blue-600 rounded-lg font-bold"
            >
              Create New Wallet
            </Link>
          )}

          {address && <WalletList address={address} />}
        </Fragment>
      </div>
    </main>
  );
}
