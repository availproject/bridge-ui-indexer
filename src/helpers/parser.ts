import { ethers } from "ethers";

export default function parseAmount(numberString: string): string {
  try {
    const number = BigInt(numberString);
    return ethers.formatEther(number).toString();
  } catch (e) {
    return "";
  }
}
