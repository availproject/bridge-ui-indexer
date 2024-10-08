import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";

export default function parseAmount(numberString: string): string {
  try {
    const number = BigNumber(numberString).toFixed();
    return ethers.formatEther(number).toString();
  } catch (e) {
    return "";
  }
}
