import { BigNumber, ethers } from "ethers";
import {
  Finding,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";
import {
  DAI_TOKEN_ADDRESS,
  PRICE_ORACLE_ABI,
  PRICE_ORACLE_ADDRESS,
  USDC_TOKEN_ADDRESS,
} from "./constants";

const provideHandleBlock = () => {
  let previousRate: number;

  const provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());

  const oracle = new ethers.Contract(
    PRICE_ORACLE_ADDRESS,
    PRICE_ORACLE_ABI,
    provider
  );

  return async () => {
    const findings: Finding[] = [];

    const [daiPrice, usdcPrice]: number[] = (
      await oracle.getAssetsPrices([DAI_TOKEN_ADDRESS, USDC_TOKEN_ADDRESS])
    ).map((p: BigNumber) => +p.toString());

    const currentRate = usdcPrice / daiPrice;

    if (previousRate && currentRate < previousRate) {
      findings.push(
        Finding.fromObject({
          name: "aUSDC/aDAI exchange rate goes down",
          description: `aUSDC/aDAI exchange rate goes down. Current rate: ${currentRate}. Previous rate: ${previousRate}`,
          alertId: "AAVE_USDCDAI_EXRATE_DOWN",
          severity: FindingSeverity.Medium,
          type: FindingType.Suspicious,
        })
      );
    }
    previousRate = currentRate;

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(),
};
