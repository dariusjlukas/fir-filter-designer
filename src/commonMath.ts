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
  sqrt,
  subtract,
} from 'mathjs';

export const sinc = (x: BigNumber): BigNumber => divide(sin(x), x) as BigNumber;

//Modified bessel function of the first kind
export const I0 = (z: BigNumber, kmax = 200): BigNumber => {
  let acc = bignumber(0);
  for (let k = 0; k < kmax; k++) {
    acc = add(
      acc,
      divide(
        pow(multiply(bignumber(0.25), pow(z, 2)), k),
        pow(factorial(bignumber(k)), 2),
      ),
    ) as BigNumber;
  }
  return acc;
};

export const calcKaiserWindow = (beta: number, length: number): BigNumber[] => {
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
        ),
        I0(bignumber(beta)),
      ) as BigNumber,
  );
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
