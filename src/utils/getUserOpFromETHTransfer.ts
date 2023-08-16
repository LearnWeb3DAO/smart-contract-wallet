import { BigNumber, Contract } from "ethers";
import { Client, Presets, UserOperationBuilder } from "userop";
import {
  BUNDLER_RPC_URL,
  WALLET_ABI,
  WALLET_FACTORY_ADDRESS,
} from "./constants";
import { entryPointContract } from "./getEntryPointContract";
import {
  RPC_URL,
  provider,
  walletFactoryContract,
} from "./getWalletFactoryContract";
import { concat, defaultAbiCoder } from "ethers/lib/utils";

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

    const builder = new UserOperationBuilder()
      .useDefaults({
        preVerificationGas: 60_000,
        callGasLimit: 100_000,
        verificationGasLimit: 2_000_000,
      })
      .setSender(walletAddress)
      .setNonce(nonce)
      .setInitCode(nonce.eq(0) ? initCode : "0x")
      .setCallData(encodedCallData)
      .useMiddleware(Presets.Middleware.getGasPrice(provider));

    const client = await Client.init(RPC_URL);

    const userOp = await client.buildUserOperation(builder);

    return userOp;
  } catch (error) {
    console.error(error);
  }
}
