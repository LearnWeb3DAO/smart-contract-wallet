import { BigNumber } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";
import { UserOperationBuilder } from "userop";

export async function getBuilder(
  walletContract: string,
  nonce: BigNumber,
  initCode: Uint8Array,
  encodedCallData: string,
  signatures: string[]
) {
  try {
    const encodedSignatures = defaultAbiCoder.encode(["bytes[]"], [signatures]);
    const builder = new UserOperationBuilder()
      .useDefaults({
        preVerificationGas: 60_000,
        callGasLimit: 100_000,
        verificationGasLimit: 2_000_000,
      })
      .setSender(walletContract)
      .setNonce(nonce)
      .setInitCode(nonce.eq(0) ? initCode : "0x")
      .setCallData(encodedCallData)
      .setSignature(encodedSignatures);

    return builder;
  } catch (e) {
    console.error(e);
    throw e;
  }
}
