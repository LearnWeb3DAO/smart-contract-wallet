import { Contract, providers } from "ethers";
import { WALLET_FACTORY_ADDRESS, WALLET_FACTORY_ABI } from "./constants";

export const RPC_URL = "https://rpc.ankr.com/eth_goerli";

export const provider = new providers.JsonRpcProvider(RPC_URL);

export const walletFactoryContract = new Contract(
  WALLET_FACTORY_ADDRESS,
  WALLET_FACTORY_ABI,
  provider
);
