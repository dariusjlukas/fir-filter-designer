import {
  bignumber,
  BigNumber,
  divide,
  floor,
  log10,
  max,
  multiply,
  pi,
  pow,
  sqrt,
  subtract,
  sum,
} from 'mathjs';
import { I0, sinc } from './commonMath';

export type KaiserDesignParams = {
  cutoffFreq: number;
  transitionBandwidth: number;
  minStopbandAttenuation: number;
  maxPassbandRipple: number;
  besselMaxIterations: number;
  besselDecimalPlaces: number;
};

export const calcKaiserWindow = (
  beta: number,
  length: number,
  besselMaxIterations: number,
  besselTolerance: BigNumber,
): BigNumber[] => {
  return [...Array(length).keys()].map(
    (n) =>
      divide(
        I0(
          multiply(
            bignumber(beta),
            sqrt(
              subtract(
                bignumber(1),
                pow(
                  subtract(
                    divide(multiply(bignumber(2), bignumber(n)), length),
                    bignumber(1),
                  ),
                  bignumber(2),
                ),
              ) as BigNumber,
            ),
          ) as BigNumber,
          besselMaxIterations,
          besselTolerance,
        ),
        I0(bignumber(beta)),
      ) as BigNumber,
  );
};

export const calcKaiserBeta = (A: number) => {
  if (A > 50) {
    return 0.1102 * (A - 8.7);
  } else if (A >= 21) {
    return 0.5842 * (A - 21) ** 0.4 + 0.07886 * (A - 21);
  } else {
    return 0;
  }
};

export const estimateKaiserTapCount = (
  A: number,
  transitionBandwidth: number,
) => floor((A - 8) / (2.285 * 2 * pi * transitionBandwidth)) + 1;

export const createKaiserLowpassFilter = (parameters: KaiserDesignParams) => {
  const A = max(
    parameters.minStopbandAttenuation,
    20 * log10(10 ** (parameters.maxPassbandRipple / 20) - 1),
  );
  const beta = calcKaiserBeta(A);
  let N = estimateKaiserTapCount(A, parameters.transitionBandwidth);
  if (N % 2 === 0) {
    N++;
  }

  const sampledSinc: BigNumber[] = [...Array(N).keys()].map((n) =>
    2 * parameters.cutoffFreq * (n - (N - 1) / 2) === 0
      ? bignumber(1)
      : sinc(bignumber(2 * parameters.cutoffFreq * (n - (N - 1) / 2))),
  );
  const kaiserWindow = calcKaiserWindow(
    beta,
    N,
    parameters.besselMaxIterations,
    bignumber(`1.0e-${parameters.besselDecimalPlaces}`),
  );

  const h = sampledSinc.map(
    (sample, index) => multiply(sample, kaiserWindow[index]) as BigNumber,
  );
  const h_sum = sum(h);
  return h.map((v) => divide(v, h_sum) as BigNumber);
};
