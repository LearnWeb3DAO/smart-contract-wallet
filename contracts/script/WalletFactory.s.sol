// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "forge-std/Script.sol";
import "../src/WalletFactory.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";

contract WalletFactoryScript is Script {
    IEntryPoint constant ENTRYPOINT =
        IEntryPoint(0x0576a174D229E3cFA37253523E645A78A0C91B57);

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        WalletFactory walletFactory = new WalletFactory(ENTRYPOINT);

        vm.stopBroadcast();
    }
}
