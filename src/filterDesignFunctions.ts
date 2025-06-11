import {
  abs,
  add,
  bignumber,
  BigNumber,
  ceil,
  Complex,
  complex,
  cos,
  deepEqual,
  divide,
  exp,
  ifft,
  larger,
  log10,
  max,
  multiply,
  pi,
  pow,
  prod,
  sqrt,
  subtract,
  sum,
} from 'mathjs';
import {
  castArrayToPrecision,
  computeEvenlySpacedSamplesOnSet,
  FilterBandResponse,
  FilterSpecTestResults,
  I0,
  sinc,
  testFilterResponseAgainstSpec,
} from './commonMath';
import { OutputDatatype, TapNumericType } from './App';
import { FilterType } from './WindowMethodDesigner';

///////////////////////////////////////
//// Parks-McClellan Filter Design ////
///////////////////////////////////////

const calcH_F = (
  extremalFrequencies: BigNumber[],
  frequencySamplePoints: BigNumber[],
  weightFunction: (F: BigNumber) => BigNumber,
  desiredResponse: (F: BigNumber) => BigNumber
) => {
  const n = extremalFrequencies.length - 2;

  const x_i = extremalFrequencies.map((F_i) =>
    cos(multiply(F_i, multiply(bignumber(pi), bignumber(2))) as BigNumber)
  );

  const a_k: BigNumber[] = [...Array(extremalFrequencies.length).keys()].map(
    (k) =>
      prod(
        [...Array(extremalFrequencies.length).keys()].map((j) =>
          j === k
            ? bignumber(1)
            : (divide(bignumber(1), subtract(x_i[k], x_i[j])) as BigNumber)
        )
      )
  );

  const rho = divide(
    sum(
      extremalFrequencies.map((F, i) =>
        multiply(a_k[i], desiredResponse(F))
      ) as BigNumber[]
    ),
    sum(
      extremalFrequencies.map((F, i) =>
        divide(a_k[i], weightFunction(F))
      ) as BigNumber[]
    )
  ) as BigNumber;

  const b_k: BigNumber[] = [...Array(n + 1).keys()].map((k) =>
    prod(
      [...Array(n + 1).keys()].map((j) =>
        j === k ? bignumber(1) : divide(bignumber(1), subtract(x_i[k], x_i[j]))
      ) as BigNumber[]
    )
  );

  const c_k: BigNumber[] = [...Array(n + 1).keys()].map((k) =>
    subtract(
      desiredResponse(extremalFrequencies[k]),
      multiply(
        bignumber(pow(-1, k) as number),
        divide(rho, weightFunction(extremalFrequencies[k]))
      ) as BigNumber
    )
  );

  const H_F = frequencySamplePoints.map((F) =>
    divide(
      sum(
        [...Array(n).keys()].map(
          (k) =>
            multiply(
              divide(
                b_k[k],
                subtract(
                  cos(multiply(bignumber(2 * pi), F) as BigNumber),
                  x_i[k]
                )
              ),
              c_k[k]
            ) as BigNumber
        )
      ),
      sum(
        [...Array(n).keys()].map(
          (k) =>
            divide(
              b_k[k],
              subtract(cos(multiply(bignumber(2 * pi), F) as BigNumber), x_i[k])
            ) as BigNumber
        )
      )
    )
  ) as BigNumber[];

  return H_F;
};

const createPMFilter = (
  bandEdges: BigNumber[],
  weightFunction: (F: BigNumber) => BigNumber,
  desiredResponse: (F: BigNumber) => BigNumber,
  tapCount: number,
  gridDensity: number
) => {
  // Create initial guess of extremal frequencies
  let extremalFrequencies = computeEvenlySpacedSamplesOnSet(
    tapCount + 2,
    bandEdges
  );
  let bestApproximation = false;
  let H_F: BigNumber[] = [];

  while (!bestApproximation) {
    //compute gridDensity*n evenly spaced frequcies on the closed set omega = union of band regions (ex: for a lowpass filter, the set of band regions is the [0, Fp] U [Fs, 0.5])
    //Note that extremalFrequencies.length = n + 2
    const frequencySamplePoints = computeEvenlySpacedSamplesOnSet(
      gridDensity * (extremalFrequencies.length - 2),
      bandEdges
    );

    // Calculate H_F
    H_F = calcH_F(
      extremalFrequencies,
      frequencySamplePoints,
      weightFunction,
      desiredResponse
    );

    // Compute the absolute value of the error function, |E(F)|
    const E_F = frequencySamplePoints.map((F, i) =>
      abs(
        multiply(
          weightFunction(F),
          subtract(desiredResponse(F), H_F[i])
        ) as BigNumber
      )
    );

    // Find the peaks of |E(F)|
    const errorPeaks: BigNumber[] = [];
    for (let i = 0; i < E_F.length; i++) {
      if (i === 0) {
        if (larger(E_F[i], E_F[i + 1])) {
          errorPeaks.push(E_F[i]);
        }
      } else if (i === E_F.length - 1) {
        if (larger(E_F[i], E_F[i - 1])) {
          errorPeaks.push(E_F[i]);
        }
      } else {
        if (larger(E_F[i], E_F[i - 1]) && larger(E_F[i], E_F[i + 1])) {
          errorPeaks.push(E_F[i]);
        }
      }
    }

    if (errorPeaks.length === tapCount + 3) {
      if (larger(errorPeaks[errorPeaks.length - 1], errorPeaks[0])) {
        errorPeaks.splice(0, 1);
      } else {
        errorPeaks.splice(errorPeaks.length - 1, 1);
      }
    }
    if (errorPeaks.length !== tapCount + 2) {
      throw new Error('Invalid number of error peaks!');
    }

    // Check if the error peaks are at the extremalFrequencies
    // If the arrays are equal, we have found the best approximation
    // Else, set the extremal frequencies to the error peaks
    // and try again.
    if (deepEqual(extremalFrequencies, errorPeaks)) {
      bestApproximation = true;
    } else {
      extremalFrequencies = errorPeaks;
    }
  }

  return ifft(
    calcH_F(
      extremalFrequencies,
      extremalFrequencies,
      weightFunction,
      desiredResponse
    )
  );
};

/////////////////////////////////////
//// Kaiser Window Filter Design ////
/////////////////////////////////////

export type KaiserDesignParams = {
  cutoffFreq: number | [number, number];
  transitionBandwidth: number;
  minStopbandAttenuation: number;
  maxPassbandRipple: number;
  besselMaxIterations: number;
  tapCount?: number;
};

export type FilterObject = {
  taps: number[] | Complex[];
  specificationMet: boolean;
  measuredPassbandResponse: FilterBandResponse[];
  measuredStopbandResponse: FilterBandResponse[];
};

export type DeserializedComplex = { mathjs: string; re: number; im: number };

export type DeserializedFilterObject = {
  taps: number[] | DeserializedComplex[];
  specificationMet: boolean;
  measuredPassbandResponse: FilterBandResponse[];
  measuredStopbandResponse: FilterBandResponse[];
};

// Design a filter using a Kaiser window and validate that the output response
// meets or exceeds the specificaiton
export const createValidatedKaiserFilter = (
  filterType: FilterType,
  tapNumericType: TapNumericType,
  tapDatatype: OutputDatatype,
  parameters: KaiserDesignParams,
  maxIterations: number = 50
): FilterObject => {
  let mutableParameters: KaiserDesignParams = JSON.parse(
    JSON.stringify(parameters)
  ) as KaiserDesignParams;
  let filterDesignComplete = false;
  let iterationCount = 0;
  let castFilterTaps: number[] | Complex[] = [];
  let filterTestResults: FilterSpecTestResults | null = null;

  const passbandEdges = (() => {
    switch (filterType) {
      case 'lowpass':
        return [
          0,
          (parameters.cutoffFreq as number) -
            parameters.transitionBandwidth / 2,
        ];
      case 'highpass':
        return [
          (parameters.cutoffFreq as number) +
            parameters.transitionBandwidth / 2,
          0.5,
        ];
      case 'bandpass':
        return [
          (parameters.cutoffFreq as [number, number])[0] +
            parameters.transitionBandwidth / 2,
          (parameters.cutoffFreq as [number, number])[1] -
            parameters.transitionBandwidth / 2,
        ];
      case 'bandstop': {
        const bandstopEdges = [
          (parameters.cutoffFreq as [number, number])[0] -
            parameters.transitionBandwidth / 2,
          (parameters.cutoffFreq as [number, number])[1] +
            parameters.transitionBandwidth / 2,
        ];
        if (tapNumericType === 'real') {
          return [0, bandstopEdges[0], bandstopEdges[1], 0.5];
        } else {
          return [-0.5, bandstopEdges[0], bandstopEdges[1], 0.5];
        }
      }
    }
  })();

  const stopbandEdges = (() => {
    switch (filterType) {
      case 'lowpass':
        return [
          (parameters.cutoffFreq as number) +
            parameters.transitionBandwidth / 2,
          0.5,
        ];
      case 'highpass':
        return [
          0,
          (parameters.cutoffFreq as number) -
            parameters.transitionBandwidth / 2,
        ];
      case 'bandpass': {
        const bandpassEdges = [
          (parameters.cutoffFreq as [number, number])[0] -
            parameters.transitionBandwidth / 2,
          (parameters.cutoffFreq as [number, number])[1] +
            parameters.transitionBandwidth / 2,
        ];
        if (tapNumericType === 'real') {
          return [0, bandpassEdges[0], bandpassEdges[1], 0.5];
        } else {
          return [-0.5, bandpassEdges[0], bandpassEdges[1], 0.5];
        }
      }
      case 'bandstop':
        return [
          (parameters.cutoffFreq as [number, number])[0] +
            parameters.transitionBandwidth / 2,
          (parameters.cutoffFreq as [number, number])[1] -
            parameters.transitionBandwidth / 2,
        ];
    }
  })();

  do {
    const filterTaps = createKaiserFilter(
      filterType,
      tapNumericType,
      mutableParameters
    );
    castFilterTaps = castArrayToPrecision(filterTaps, tapDatatype);

    filterTestResults = testFilterResponseAgainstSpec(
      castFilterTaps,
      passbandEdges,
      stopbandEdges,
      [...Array(passbandEdges.length / 2).keys()].map(
        () => parameters.maxPassbandRipple
      ),
      [...Array(stopbandEdges.length / 2).keys()].map(
        () => -parameters.minStopbandAttenuation
      )
    );

    if (filterTestResults.specMet) {
      filterDesignComplete = true;
    } else {
      iterationCount++;
      switch (filterTestResults.failureReason) {
        case 'passband':
          mutableParameters.maxPassbandRipple -=
            mutableParameters.maxPassbandRipple * 0.1;
          break;
        case 'stopband':
          mutableParameters.minStopbandAttenuation += 0.5;
          break;
      }
    }
  } while (!filterDesignComplete && iterationCount < maxIterations);

  return {
    taps: castFilterTaps,
    specificationMet: filterDesignComplete,
    measuredPassbandResponse: filterTestResults?.filterPassbandResponse,
    measuredStopbandResponse: filterTestResults.filterStopbandResponse,
  };
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
                    divide(multiply(bignumber(2), bignumber(n)), length - 1),
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
) => {
  const tapEstimate =
    ceil(abs((A - 8) / (2.285 * 2 * pi * transitionBandwidth))) + 1;
  if (tapEstimate % 2 === 0) {
    return tapEstimate + 1;
  } else {
    return tapEstimate;
  }
};

// Design a filter using a Kaiser window
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
  let N =
    parameters.tapCount !== undefined
      ? parameters.tapCount
      : estimateKaiserTapCount(A, parameters.transitionBandwidth);
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
    const hSum = sum(h);
    return h.map((v) => divide(v, hSum) as BigNumber);
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
  }
};
