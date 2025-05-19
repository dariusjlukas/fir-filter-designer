import {
  abs,
  add,
  bignumber,
  BigNumber,
  Complex,
  complex,
  divide,
  exp,
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
import { FilterType, TapNumericType } from './App';

export type KaiserDesignParams = {
  cutoffFreq: number | [number, number];
  transitionBandwidth: number;
  minStopbandAttenuation: number;
  maxPassbandRipple: number;
  besselMaxIterations: number;
};

export const calcKaiserWindow = (
  beta: number,
  length: number,
  besselMaxIterations: number,
  besselTolerance: BigNumber
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
                    bignumber(1)
                  ),
                  bignumber(2)
                )
              ) as BigNumber
            )
          ) as BigNumber,
          besselMaxIterations,
          besselTolerance
        ),
        I0(bignumber(beta))
      ) as BigNumber
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
  transitionBandwidth: number
) => floor((A - 8) / (2.285 * 2 * pi * transitionBandwidth)) + 1;

export const createKaiserFilter = (
  filterType: FilterType,
  tapNumericType: TapNumericType,
  parameters: KaiserDesignParams
): BigNumber[] | Complex[] => {
  const A = max(
    parameters.minStopbandAttenuation,
    abs(20 * log10(10 ** (parameters.maxPassbandRipple / 20) - 1))
  );
  const beta = calcKaiserBeta(A);
  let N = estimateKaiserTapCount(A, parameters.transitionBandwidth);
  if (N % 2 === 0) {
    N++;
  }
  const kaiserWindow = calcKaiserWindow(
    beta,
    N,
    parameters.besselMaxIterations,
    bignumber(`1.0e-${14}`)
  );

  const designLowpass = (cutoff: number) => {
    const sampledSinc: BigNumber[] = [...Array(N).keys()].map((n) =>
      2 * cutoff * (n - (N - 1) / 2) === 0
        ? bignumber(1)
        : sinc(bignumber(2 * cutoff * (n - (N - 1) / 2)))
    );

    const h = sampledSinc.map(
      (sample, index) => multiply(sample, kaiserWindow[index]) as BigNumber
    );
    const h_sum = sum(h);
    return h.map((v) => divide(v, h_sum) as BigNumber);
  };

  const spectralInvert = (input: BigNumber[]) => {
    return input.map((v, i) =>
      i % 2 === 0 ? v : multiply(bignumber(-1), v)
    ) as BigNumber[];
  };

  const heterodyneFilter = (
    input: BigNumber[],
    shiftAmount: number,
    tapNumericType: TapNumericType
  ) => {
    if (typeof parameters.cutoffFreq === 'object') {
      const shiftedSignal = input.map((v, n) =>
        multiply(v, exp(complex(0, 2 * pi * shiftAmount * n)))
      ) as Complex[];
      if (tapNumericType === 'real') {
        return shiftedSignal.map((v) =>
          multiply(bignumber(v.re), bignumber(2))
        ) as BigNumber[];
      } else {
        return shiftedSignal;
      }
    } else {
      return [bignumber(0)];
    }
  };

  switch (filterType) {
    case 'lowpass':
      return designLowpass(parameters.cutoffFreq as number);
    case 'highpass':
      return spectralInvert(
        designLowpass(0.5 - (parameters.cutoffFreq as number))
      );
    case 'bandpass':
      return heterodyneFilter(
        designLowpass(
          ((parameters.cutoffFreq as [number, number])[1] -
            (parameters.cutoffFreq as [number, number])[0]) /
            2
        ),
        ((parameters.cutoffFreq as [number, number])[1] -
          (parameters.cutoffFreq as [number, number])[0]) /
          2 +
          (parameters.cutoffFreq as [number, number])[0],
        tapNumericType
      );
    case 'bandstop': {
      const lowpass = designLowpass(
        (parameters.cutoffFreq as [number, number])[0]
      );
      const highpass = spectralInvert(
        designLowpass(0.5 - (parameters.cutoffFreq as [number, number])[1])
      );
      return lowpass.map((v, i) => add(v, highpass[i]));
    }
    // return heterodyneFilter(spectralInvert(lowpass), (((parameters.cutoffFreq as [number, number])[1] - (parameters.cutoffFreq as [number, number])[0]) / 2 +
    // (parameters.cutoffFreq as [number, number])[0]));
    // return spectralInvert(
    //   heterodyneFilter(lowpass, (((parameters.cutoffFreq as [number, number])[1] - (parameters.cutoffFreq as [number, number])[0]) / 2 +
    // (parameters.cutoffFreq as [number, number])[0]))
    // )
  }
};
