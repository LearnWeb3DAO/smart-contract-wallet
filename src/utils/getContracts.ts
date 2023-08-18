import { Contract, providers } from "ethers";
import { Constants } from "userop";
import {
  BUNDLER_RPC_URL,
  ENTRY_POINT_ABI,
  WALLET_ABI,
  WALLET_FACTORY_ABI,
  WALLET_FACTORY_ADDRESS,
} from "./constants";

export const provider = new providers.JsonRpcProvider(BUNDLER_RPC_URL);

export const entryPointContract = new Contract(
  Constants.ERC4337.EntryPoint,
  ENTRY_POINT_ABI,
  provider
);

export const walletFactoryContract = new Contract(
  WALLET_FACTORY_ADDRESS,
  WALLET_FACTORY_ABI,
  provider
);

export const getWalletContract = (walletAddress: string) => {
  return new Contract(walletAddress, WALLET_ABI, provider);
};
