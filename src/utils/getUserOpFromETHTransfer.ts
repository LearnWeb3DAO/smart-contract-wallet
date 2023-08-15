import { BigNumber, Contract } from "ethers";
import { Client, Presets, UserOperationBuilder } from "userop";
import { WALLET_ABI, WALLET_FACTORY_ADDRESS } from "./constants";
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
  signatures: string[],
  toAddress: string,
  value: BigNumber
) {
  try {
    const walletContract = new Contract(walletAddress, WALLET_ABI, provider);

    const data = walletFactoryContract.interface.encodeFunctionData(
      "createAccount",
      [owners, BigInt(salt)]
    );
    const initCode = concat([WALLET_FACTORY_ADDRESS, data]);
    const nonce: BigNumber = await entryPointContract.getNonce(
      walletAddress,
      0
    );
    const encodedSignatures = defaultAbiCoder.encode(["bytes[]"], [signatures]);
    const encodedCallData = walletContract.interface.encodeFunctionData(
      "execute",
      [toAddress, value, data]
    );

    console.log("init builder");
    const builder = new UserOperationBuilder()
      .useDefaults({
        preVerificationGas: BigInt(21000),
        callGasLimit: BigInt(100000),
        verificationGasLimit: BigInt(2000000),
      })
      .setSender(walletAddress)
      .setNonce(nonce)
      .setInitCode(nonce.eq(0) ? initCode : "0x")
      .setSignature(encodedSignatures)
      .setCallData(encodedCallData)
      .useMiddleware(Presets.Middleware.getGasPrice(provider));

    const client = await Client.init(RPC_URL);

    console.log("building userop");
    const userOp = await client.buildUserOperation(builder);
    console.log("hello");
    return userOp;
  } catch (error) {
    console.error(error);
  }
}
