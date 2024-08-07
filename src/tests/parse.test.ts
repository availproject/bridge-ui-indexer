import assert from "assert/strict";
import { BigNumber } from "bignumber.js";
import parseAmount from "../helpers/parser.js";

function testNormalBigAmount() {
  const rawFungibleTokenAmount = "0x00000000000000000de0b6b3a7640000";
  const bigNumberString = BigNumber(rawFungibleTokenAmount, 16).toFixed(0);
  const amountPrettified = parseAmount(bigNumberString);
  const expectedParsedAmount = "1.0";
  assert.deepStrictEqual(amountPrettified, expectedParsedAmount);
}

function testScientificBigAmount() {
  const rawFungibleTokenAmount = "0x000000000000182a697403a1b0cf0ad2";
  const bigNumberString = BigNumber(rawFungibleTokenAmount, 16).toFixed(0);
  const amountPrettified = parseAmount(bigNumberString);
  const expectedParsedAmount = "114119.157542431558142674";
  assert.deepStrictEqual(amountPrettified, expectedParsedAmount);
}

testNormalBigAmount();
testScientificBigAmount();
