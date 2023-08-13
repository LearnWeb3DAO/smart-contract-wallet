export default function WalletPage({
  params: { address },
}: {
  params: { address: string };
}) {
  return (
    <div>
      <h1>Wallet Page for {address}</h1>
    </div>
  );
}
