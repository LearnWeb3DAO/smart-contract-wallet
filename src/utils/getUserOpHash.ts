import { defaultAbiCoder, keccak256 } from "ethers/lib/utils";
import { Constants, IUserOperation } from "userop";
import { goerli } from "wagmi/chains";

export default async function getUserOpHash(userOp: IUserOperation) {
  const encodedUserOp = defaultAbiCoder.encode(
    [
      "address",
      "uint256",
      "bytes32",
      "bytes32",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "bytes32",
    ],
    [
      userOp.sender,
      userOp.nonce,
      keccak256(userOp.initCode),
      keccak256(userOp.callData),
      userOp.callGasLimit,
      userOp.verificationGasLimit,
      userOp.preVerificationGas,
      userOp.maxFeePerGas,
      userOp.maxPriorityFeePerGas,
      keccak256(userOp.paymasterAndData),
    ]
  );
  const encodedUserOpWithChainIdAndEntryPoint = defaultAbiCoder.encode(
    ["bytes32", "address", "uint256"],
    [keccak256(encodedUserOp), Constants.ERC4337.EntryPoint, goerli.id]
  );

  return keccak256(encodedUserOpWithChainIdAndEntryPoint);
}
