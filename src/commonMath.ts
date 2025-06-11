import { Float16Array } from '@petamoriken/float16';
import {
  abs,
  add,
  bignumber,
  BigNumber,
  ceil,
  complex,
  Complex,
  divide,
  equal,
  factorial,
  fft,
  floor,
  isComplex,
  larger,
  log10,
  log2,
  multiply,
  number,
  pi,
  pow,
  sin,
  smaller,
  smallerEq,
  subtract,
} from 'mathjs';

export const sinc = (x: BigNumber): BigNumber => {
  if (equal(x, bignumber(0))) {
    return bignumber(1);
  } else {
    const pix = multiply(bignumber(pi), x) as BigNumber;
    return divide(sin(pix), pix) as BigNumber;
  }
};

//Zeroth-order Modified Bessel function of the first kind
export const I0 = (
  z: BigNumber,
  kmax = 1000,
  tolerance = bignumber('1.0e-14')
): BigNumber => {
  let acc = bignumber(0);
  for (let k = 0; k < kmax; k++) {
    const nextIterationValue = divide(
      pow(multiply(bignumber(0.25), pow(z, 2)), k),
      pow(factorial(bignumber(k)), 2)
    );
    if (smaller(nextIterationValue, tolerance)) {
      k = kmax;
      break;
    } else {
      acc = add(acc, nextIterationValue) as BigNumber;
    }
  }
  return acc;
};

export const fftshift = (fftValues: Complex[] | number[] | BigNumber[]) => {
  return fftValues
    .slice(fftValues.length / 2)
    .concat(fftValues[0])
    .concat(fftValues.slice(1, fftValues.length / 2));
};

//Based on the Arduino function Map()
export const linearMap = (
  x: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

// Compute filter frequency response
const computeFilterFrequencyResponse = (
  filterTaps: number[] | Complex[],
  fftLengthScalar: number = 100
) =>
  (
    abs(
      fftshift(
        fft(
          Array(2 ** ceil(log2(filterTaps.length * fftLengthScalar)) / 2)
            .fill(0)
            .concat([...filterTaps])
            .concat(
              Array(
                2 ** ceil(log2(filterTaps.length * fftLengthScalar)) / 2
              ).fill(0)
            )
        )
      )
    ) as number[]
  ).map((mag) => 20 * log10(mag));

// Compute evenly spaced samples on a discontinuous, non-overlapping set
export const computeEvenlySpacedSamplesOnSet = (
  sampleCount: number,
  setEdges: BigNumber[]
) => {
  const sampleSpacing: BigNumber = divide(
    setEdges.reduce(
      (rangeSum, _, i) =>
        i % 2 === 0
          ? rangeSum
          : add(rangeSum, subtract(setEdges[i], setEdges[i - 1])),
      bignumber(0)
    ),
    bignumber(sampleCount - 1)
  ) as BigNumber;

  const sampleFrequencies: BigNumber[] = [setEdges[0]];

  let setIndex = 0;
  for (let sampleIndex = 1; sampleIndex < sampleCount; sampleIndex++) {
    // Determine which set the next sample falls in
    let remainingStepDistance = sampleSpacing;
    let currentStepFreq = sampleFrequencies[sampleIndex - 1];
    while (larger(remainingStepDistance, bignumber(0))) {
      // Check if the next sample is in the current set
      const nextLinearStep = add(currentStepFreq, remainingStepDistance);
      if (smallerEq(nextLinearStep, setEdges[setIndex + 1])) {
        sampleFrequencies.push(nextLinearStep);
        remainingStepDistance = bignumber(0);
      } else {
        const distanceToSetEdge = subtract(
          setEdges[setIndex + 1],
          currentStepFreq
        );
        // Subtract the distance to the set edge from the remaining step distance
        remainingStepDistance = subtract(
          remainingStepDistance,
          distanceToSetEdge
        );
        // Set the step frequency to the edge of the next set
        currentStepFreq = setEdges[setIndex + 2];
        // Increment to the next set
        setIndex += 2;
      }
    }
  }

  return sampleFrequencies;
};

const getFractionalBinIndex = (
  frequency: number,
  frequencyResponseLength: number
) => frequency * frequencyResponseLength + frequencyResponseLength / 2;

// Linearly interpolate between FFT bin values to extimate the frequency response at a given frequency
export const getInterpolatedResponseValue = (
  frequency: number,
  frequencyResponse: number[]
) => {
  const fractionalBinIndex = getFractionalBinIndex(
    frequency,
    frequencyResponse.length
  );

  // Check for array limits
  if (fractionalBinIndex <= 0) {
    return frequencyResponse[0];
  } else if (fractionalBinIndex >= frequencyResponse.length - 1) {
    return frequencyResponse[frequencyResponse.length - 1];
  }

  const leftBinIndex = Number(floor(fractionalBinIndex));
  const rightBinIndex = Number(ceil(fractionalBinIndex));
  const leftBinValue = frequencyResponse[leftBinIndex];
  const rightBinValue = frequencyResponse[rightBinIndex];
  return (
    (rightBinValue - leftBinValue) *
      (fractionalBinIndex - floor(fractionalBinIndex)) +
    leftBinValue
  );
};

export type FilterBandResponse = {
  minValue: number;
  maxValue: number;
};

// Measure the frequency response of a filter in each band (in normalized frequency)
export const measureFilterResponse = (
  filterTaps: number[] | Complex[],
  bandEdges: number[]
): FilterBandResponse[] => {
  // Check that there are an even number of band edges
  if (bandEdges.length % 2 !== 0) {
    throw new Error('Invalid number of band edges!');
  }

  const frequencyResponse = computeFilterFrequencyResponse(filterTaps);

  // Get the min and max filter response value in each band
  const filterBandResponse: { minValue: number; maxValue: number }[] = [];

  for (let bandIndex = 0; bandIndex < bandEdges.length; bandIndex += 2) {
    // Linearly interpolate for band edges
    const leftBandEdgeValue = getInterpolatedResponseValue(
      bandEdges[bandIndex],
      frequencyResponse
    );
    const rightBandEdgeValue = getInterpolatedResponseValue(
      bandEdges[bandIndex + 1],
      frequencyResponse
    );
    let minValue = leftBandEdgeValue;
    let maxValue = leftBandEdgeValue;
    if (rightBandEdgeValue < leftBandEdgeValue) {
      minValue = rightBandEdgeValue;
    } else if (rightBandEdgeValue > leftBandEdgeValue) {
      maxValue = rightBandEdgeValue;
    }

    for (
      let bin = Number(
        ceil(
          getFractionalBinIndex(bandEdges[bandIndex], frequencyResponse.length)
        )
      );
      bin <
      Number(
        floor(
          getFractionalBinIndex(
            bandEdges[bandIndex + 1],
            frequencyResponse.length
          )
        )
      );
      bin++
    ) {
      if (frequencyResponse[bin] < minValue) {
        minValue = frequencyResponse[bin];
      } else if (frequencyResponse[bin] > maxValue) {
        maxValue = frequencyResponse[bin];
      }
    }

    filterBandResponse.push({ minValue, maxValue });
  }

  return filterBandResponse;
};

// Test if the filter with the provided taps meets the provided specification
// If the specification is met, it returns {specMet: true}
// Else it returns {specMet: false, failureReason: _}, where failureReason is set to
// the first instance of the specification being broken
export type FilterSpecTestResults = {
  specMet: boolean;
  filterPassbandResponse: FilterBandResponse[];
  filterStopbandResponse: FilterBandResponse[];
  failureReason?: 'passband' | 'stopband';
};

export const testFilterResponseAgainstSpec = (
  filterTaps: number[] | Complex[],
  passbandEdges: number[],
  stopbandEdges: number[],
  allowablePassbandRipple: number[],
  stopbandDesiredResponse: number[]
): FilterSpecTestResults => {
  const filterPassbandResponse = measureFilterResponse(
    filterTaps,
    passbandEdges
  );
  const filterStopbandResponse = measureFilterResponse(
    filterTaps,
    stopbandEdges
  );

  // Check if the filter meets the desired response specification in each band
  for (let i = 0; i < filterPassbandResponse.length; i++) {
    const bandResponse = filterPassbandResponse[i];
    if (
      !(
        abs(bandResponse.maxValue) <= allowablePassbandRipple[i] &&
        abs(bandResponse.minValue) <= allowablePassbandRipple[i]
      )
    ) {
      return {
        specMet: false,
        failureReason: 'passband',
        filterPassbandResponse,
        filterStopbandResponse,
      };
    }
  }
  for (let i = 0; i < filterStopbandResponse.length; i++) {
    const bandResponse = filterStopbandResponse[i];
    if (!(bandResponse.maxValue <= stopbandDesiredResponse[i])) {
      return {
        specMet: false,
        failureReason: 'stopband',
        filterPassbandResponse,
        filterStopbandResponse,
      };
    }
  }
  return { specMet: true, filterPassbandResponse, filterStopbandResponse };
};

export const castArrayToPrecision = (
  inputArray: BigNumber[] | Complex[],
  outputDatatype: 'float64' | 'float32' | 'float16'
) => {
  if (!isComplex(inputArray[0])) {
    switch (outputDatatype) {
      case 'float64':
        return Array.from(new Float64Array(number(inputArray) as number[]));
      case 'float32':
        return Array.from(new Float32Array(number(inputArray) as number[]));
      case 'float16':
        return Array.from(new Float16Array(number(inputArray) as number[]));
    }
  } else {
    const realArray = inputArray.map((v) => (v as Complex).re);
    const imaginaryArray = inputArray.map((v) => (v as Complex).im);

    switch (outputDatatype) {
      case 'float64': {
        const castRealArray = new Float64Array(realArray);
        const castImaginaryArray = new Float64Array(imaginaryArray);
        const complexArray = [];
        for (let i = 0; i < castRealArray.length; i++) {
          complexArray.push(complex(castRealArray[i], castImaginaryArray[i]));
        }
        return complexArray;
      }
      case 'float32': {
        const castRealArray = new Float32Array(realArray);
        const castImaginaryArray = new Float32Array(imaginaryArray);
        const complexArray = [];
        for (let i = 0; i < castRealArray.length; i++) {
          complexArray.push(complex(castRealArray[i], castImaginaryArray[i]));
        }
        return complexArray;
      }
      case 'float16': {
        const castRealArray = new Float16Array(realArray);
        const castImaginaryArray = new Float16Array(imaginaryArray);
        const complexArray = [];
        for (let i = 0; i < castRealArray.length; i++) {
          complexArray.push(complex(castRealArray[i], castImaginaryArray[i]));
        }
        return complexArray;
      }
    }
  }
};
