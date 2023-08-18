import { Contract, providers } from "ethers";
import { Constants } from "userop";
import { BUNDLER_RPC_URL, ENTRY_POINT_ABI } from "./constants";

export const bundlerProvider = new providers.JsonRpcProvider(BUNDLER_RPC_URL);

export const entryPointContract = new Contract(
  Constants.ERC4337.EntryPoint,
  ENTRY_POINT_ABI,
  bundlerProvider
);
