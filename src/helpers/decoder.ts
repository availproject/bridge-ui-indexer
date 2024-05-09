import ABIDecoder from 'abi-decoder-typescript';
import { decodeParameters } from "web3-eth-abi";
import { IRetData } from '../types/index.js';
const abiDecoder = new ABIDecoder.default();

export default class Decoder {

  formatDataToDecode(inputData: string): string {
    const methodID = inputData.slice(0, 10);
    let input = inputData.slice(10);
    while (input.length % 32 != 0) {
      input = input.concat('0');
    }
    return methodID.concat(input);
  }

  decodeMethod(inputData: string): IRetData | undefined {
    try {
      let decodedData = null;
      try {
        decodedData = abiDecoder.decodeMethod(inputData);
      } catch (e) {
        inputData = this.formatDataToDecode(inputData);
        decodedData = abiDecoder.decodeMethod(inputData);
      }
      return decodedData;
    } catch (error) {
      return undefined;
    }
  }

  getParsedTxDataFromAbiDecoder(
    inputData: string, abi: Array<unknown>, name: string
  ): { success: boolean, result?: IRetData } {
    try {
      abiDecoder.addABI(abi);
      let decodedData = this.decodeMethod(inputData);

      if (decodedData && decodedData.name === name) {
        return {
          success: true,
          result: decodedData,
        };
      }
      return {
        success: false,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  };

  decodeReceiveAVAIL(inputData: string): { [key: string]: any } {

    // Define the function inputs structure
    const inputs = [
      {
        name: "message",
        type: "tuple",
        components: [
          { name: "messageType", type: "bytes1" },
          { name: "from", type: "bytes32" },
          { name: "to", type: "bytes32" },
          { name: "originDomain", type: "uint32" },
          { name: "destinationDomain", type: "uint32" },
          { name: "data", type: "bytes" },
          { name: "messageId", type: "uint64" },
        ],
      },
      {
        name: "input",
        type: "tuple",
        components: [
          { name: "dataRootProof", type: "bytes32[]" },
          { name: "leafProof", type: "bytes32[]" },
          { name: "rangeHash", type: "bytes32" },
          { name: "dataRootIndex", type: "uint256" },
          { name: "blobRoot", type: "bytes32" },
          { name: "bridgeRoot", type: "bytes32" },
          { name: "leaf", type: "bytes32" },
          { name: "leafIndex", type: "uint256" },
        ],
      },
    ];

    // Decode the function call data
    return decodeParameters(inputs, `0x${inputData.slice(10)}`);
  }
}
