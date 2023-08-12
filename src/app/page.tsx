"use client";
import CreateSCW from "@/components/createSCW";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="flex flex-col h-screen">
      <div className="flex justify-end p-2">
        <ConnectButton />
      </div>

      <div className="flex flex-col h-full justify-center items-center">
        {isConnected && <Link href="/create-wallet">Create Wallet</Link>}
      </div>
    </main>
  );
}
