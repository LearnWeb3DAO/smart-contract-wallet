import CreateSCW from "@/components/createSCW";

export default function CreateWalletPage() {
  return (
    <main className="flex flex-col py-6 items-center gap-5">
      <h1 className="text-5xl font-bold">Create New Wallet</h1>
      <p className="text-gray-400">
        Enter the signer addresses for this account
      </p>
      <CreateSCW />
    </main>
  );
}
