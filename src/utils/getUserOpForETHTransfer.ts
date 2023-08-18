import { BigNumber } from "ethers";
import { concat } from "ethers/lib/utils";
import { Client, Presets } from "userop";
import { BUNDLER_RPC_URL, WALLET_FACTORY_ADDRESS } from "./constants";
import {
  entryPointContract,
  getWalletContract,
  provider,
  walletFactoryContract,
} from "./getContracts";
import { getUserOperationBuilder } from "./getUserOperationBuilder";

export async function getUserOpForETHTransfer(
  walletAddress: string,
  owners: string[],
  salt: string,
  toAddress: string,
  value: BigNumber,
  isDeployed?: boolean
) {
  try {
    let initCode = Uint8Array.from([]);
    if (!isDeployed) {
      const data = walletFactoryContract.interface.encodeFunctionData(
        "createAccount",
        [owners, salt]
      );
      initCode = concat([WALLET_FACTORY_ADDRESS, data]);
    }

    const nonce: BigNumber = await entryPointContract.getNonce(
      walletAddress,
      0
    );

    const walletContract = getWalletContract(walletAddress);
    const encodedCallData = walletContract.interface.encodeFunctionData(
      "execute",
      [toAddress, value, initCode]
    );

    const builder = await getUserOperationBuilder(
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
