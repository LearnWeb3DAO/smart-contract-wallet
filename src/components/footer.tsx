import Link from "next/link";

export default function Footer() {
  return (
    <div className="w-full px-6 border-t border-t-gray-700 py-2 text-center">
      Build your own account-abstracted multisig wallet with{" "}
      <Link
        href="https://learnweb3.io/"
        target="_blank"
        className="text-blue-500 hover:text-blue-600"
      >
        LearnWeb3
      </Link>
      !
    </div>
  );
}
