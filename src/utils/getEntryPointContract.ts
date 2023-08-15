import { Contract, getDefaultProvider } from "ethers";
import { Constants } from "userop";
import { ENTRY_POINT_ABI } from "./constants";

const provider = getDefaultProvider("goerli");

export const entryPointContract = new Contract(
  Constants.ERC4337.EntryPoint,
  ENTRY_POINT_ABI,
  provider
);
