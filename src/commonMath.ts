import {
  add,
  bignumber,
  BigNumber,
  Complex,
  divide,
  factorial,
  multiply,
  pow,
  sin,
  smaller,
} from 'mathjs';

export const sinc = (x: BigNumber): BigNumber => divide(sin(x), x) as BigNumber;

//Modified bessel function of the first kind
export const I0 = (
  z: BigNumber,
  kmax = 1000,
  tolerance = bignumber('1.0e-14'),
): BigNumber => {
  let acc = bignumber(0);
  for (let k = 0; k < kmax; k++) {
    const nextIterationValue = divide(
      pow(multiply(bignumber(0.25), pow(z, 2)), k),
      pow(factorial(bignumber(k)), 2),
    );
    if (smaller(nextIterationValue, tolerance)) {
      console.log('tolerance reached, exiting early');
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
    .slice(fftValues.length / 2, -1)
    .concat(fftValues[0])
    .concat(fftValues.slice(1, fftValues.length / 2 - 1));
};

//Based on the Arduino function Map()
export const linearMap = (
  x: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
