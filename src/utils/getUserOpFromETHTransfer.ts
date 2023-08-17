import { BigNumber, Contract } from "ethers";
import { concat } from "ethers/lib/utils";
import { Client, Presets, UserOperationBuilder } from "userop";
import {
  BUNDLER_RPC_URL,
  WALLET_ABI,
  WALLET_FACTORY_ADDRESS,
} from "./constants";
import { entryPointContract } from "./getEntryPointContract";
import { provider, walletFactoryContract } from "./getWalletFactoryContract";
import { getBuilder } from "./getBuilder";

export async function getUserOpForETHTransfer(
  walletAddress: string,
  owners: string[],
  salt: string,
  toAddress: string,
  value: BigNumber
) {
  try {
    const walletContract = new Contract(walletAddress, WALLET_ABI, provider);

    const data = walletFactoryContract.interface.encodeFunctionData(
      "createAccount",
      [owners, salt]
    );
    const initCode = concat([WALLET_FACTORY_ADDRESS, data]);
    const nonce: BigNumber = await entryPointContract.getNonce(
      walletAddress,
      0
    );
    const encodedCallData = walletContract.interface.encodeFunctionData(
      "execute",
      [toAddress, value, data]
    );

    const builder = await getBuilder(
      walletContract.address,
      nonce,
      initCode,
      encodedCallData,
      []
    );

    builder.useMiddleware(Presets.Middleware.getGasPrice(provider));

    const client = await Client.init(BUNDLER_RPC_URL);

    await client.buildUserOperation(builder);

    const userOp = builder.getOp();

    return userOp;
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      window.alert(e.message);
    }
  }
}
