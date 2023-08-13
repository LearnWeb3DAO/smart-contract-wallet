import { WALLET_FACTORY_ABI, WALLET_FACTORY_ADDRESS } from "@/constants";
import { createPublicClient, getContract, http } from "viem";
import { goerli } from "viem/chains";

const publicClient = createPublicClient({
  chain: goerli,
  transport: http(),
});

export const walletFactoryContract = getContract({
  address: WALLET_FACTORY_ADDRESS,
  abi: WALLET_FACTORY_ABI,
  publicClient,
});
