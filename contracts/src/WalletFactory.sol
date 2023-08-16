// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {Wallet} from "./Wallet.sol";
import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract WalletFactory {
    Wallet public immutable walletImplementation;

    constructor(IEntryPoint entryPoint) {
        walletImplementation = new Wallet(entryPoint, address(this));
    }

    function createAccount(
        address[] memory owners,
        uint256 salt
    ) external returns (Wallet) {
        address addr = getAddress(owners, salt);
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return Wallet(payable(addr));
        }

        bytes memory walletInit = abi.encodeCall(Wallet.initialize, owners);
        ERC1967Proxy proxy = new ERC1967Proxy{salt: bytes32(salt)}(
            address(walletImplementation),
            walletInit
        );

        return Wallet(payable(address(proxy)));
    }

    function getAddress(
        address[] memory owners,
        uint256 salt
    ) public view returns (address) {
        bytes memory walletInit = abi.encodeCall(Wallet.initialize, owners);
        bytes memory proxyConstructor = abi.encode(
            address(walletImplementation),
            walletInit
        );
        bytes memory bytecode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            proxyConstructor
        );

        bytes32 bytecodeHash = keccak256(bytecode);

        return Create2.computeAddress(bytes32(salt), bytecodeHash);
    }
}
