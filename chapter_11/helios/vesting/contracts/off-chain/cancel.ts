import {
    Address,
    NetworkParams,
    Program,
    Value,
    TxOutput,
    Tx,
    Wallet,
    WalletHelper
} from "@hyperionbt/helios";
  
  import {
    optimize
  } from '../config/settings';
  import { getVestingUtxo } from './network';
  import { Network, ReturnType } from "./types";
  
  
  export type CancelArgs = {
      lockAmount: bigint;
      wallet: Wallet;
      params: NetworkParams;
      validator: string;
      network: Network;
  }
  
  export default async function unlock (
      {lockAmount, wallet, params, validator, network} : CancelArgs) : Promise<ReturnType> {
      
      try {
        const walletHelper = new WalletHelper(wallet);
        const lockAdaVal = new Value(BigInt(lockAmount));
  
        // Get wallet UTXOs
        const utxos = await walletHelper.pickUtxos(lockAdaVal);
  
        // Get change address
        const changeAddr = await walletHelper.changeAddress;

         // Get receiving address(es)
        const receivingAddr = await walletHelper.allAddresses;

        // Start building the transaction
        const tx = new Tx();
  
        // Add the UTXO as inputs
        tx.addInputs(utxos[0]);
  
        // Compile the vesting validator
        const vestingProgram  = Program.new(validator);
        const uplcProgram = vestingProgram.compile(optimize);

        // Add the script as a witness to the transaction
        tx.attachScript(uplcProgram);

        // Create the vesting claim redeemer
        const vestingRedeemer = (new vestingProgram .types.Redeemer.Cancel())
                              ._toUplcData();
  
        if (network.networkName === "emulator") {
            // Get the UTXO(s) locked at the vesting contract (if any)
            const vestingUtxo = await network.emulator!.getUtxos(
                Address.fromHashes(uplcProgram.validatorHash)
            );
        
            // Check that UTXO input exists
            if (vestingUtxo.length > 0) {
                tx.addInput(vestingUtxo[0], vestingRedeemer);  
            } else {
                throw console.error("No UTXOs found at vesting contract address: ",
                    Address.fromHashes(uplcProgram.validatorHash).toBech32);
            }
        } else {
            // Get the UTXO(s) locked at the vesting contract (if any)
            const vestingUtxo = await getVestingUtxo(
                Address.fromHashes(uplcProgram.validatorHash)
            );
        
            // Check that UTXO input exists
            if (vestingUtxo) {
                tx.addInput(vestingUtxo, vestingRedeemer);  
            } else {
                throw console.error("No UTXOs found at vesting contract address: ",
                    Address.fromHashes(uplcProgram.validatorHash).toBech32);
            }
        }
      
        // Construct the output to send the unlocked funds to
        tx.addOutput(new TxOutput(
            receivingAddr[0], // send to the frist receiving address
            new Value(lockAmount)
        ));

        // Add the public key hash as a required signer to the transaction
        tx.addSigner(receivingAddr[0].pubKeyHash!)
  
        // Send any change back to the user
        await tx.finalize(params, changeAddr, utxos[1]);
  
        // Sign the unsigned tx to get the witness
        const signatures = await wallet.signTx(tx);
        tx.addSignatures(signatures);
  
        // Submit the signed tx
        const txHash = await wallet.submitTx(tx);
  
        return {
          status: 200,
          txName: 'Cancel', 
          txId: txHash.hex,
          cpu: tx.witnesses.redeemers[0].cpuCost,
          mem: tx.witnesses.redeemers[0].memCost,
          fee: tx.body.fee
        } as ReturnType;
  
      } catch (err) {
          return {
              status: 400, 
              msg: "Cancel tx failed: " + err
          } as ReturnType;
      }
    }