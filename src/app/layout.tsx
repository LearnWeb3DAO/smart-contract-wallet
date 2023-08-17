"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col ">
            <div className="flex justify-end p-2">
              <ConnectButton />
            </div>
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
