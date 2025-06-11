import { bignumber } from 'mathjs';
import {
  computeEvenlySpacedSamplesOnSet,
  fftshift,
  I0,
  linearMap,
  measureFilterResponse,
  sinc,
} from './commonMath';
import { expect, test } from 'vitest';

test('Test sinc function', () => {
  expect(sinc(bignumber(0))).toBeCloseTo(1);
  expect(sinc(bignumber(0.1))).toBeCloseTo(0.983631643083466, 10);
  expect(sinc(bignumber(1))).toBeCloseTo(3.8981718325193755e-17, 10);
  expect(sinc(bignumber(2))).toBeCloseTo(-3.8981718325193755e-17, 10);
});

test('Test Bessel function', () => {
  expect(I0(bignumber(0))).toBeCloseTo(1);
  expect(I0(bignumber(1))).toBeCloseTo(1.2660658777520082, 10);
  expect(I0(bignumber(2))).toBeCloseTo(2.279585302336067, 10);
  expect(I0(bignumber(3))).toBeCloseTo(4.880792585865024, 10);
  expect(I0(bignumber(10))).toBeCloseTo(2815.716628466254, 10);
  expect(I0(bignumber(20))).toBeCloseTo(43558282.559553534, 10);
  expect(I0(bignumber(30))).toBeCloseTo(781672297823.9775, 10);
  expect(I0(bignumber(11))).toBeCloseTo(7288.489339821248, 10);
  expect(I0(bignumber(12))).toBeCloseTo(18948.92534929631, 10);
  expect(I0(bignumber(13))).toBeCloseTo(49444.489582217575, 10);
  expect(I0(bignumber(100))).toBeCloseTo(1.0737517071310738e42, 10);
  expect(I0(bignumber(101))).toBeCloseTo(2.904238197186649e42, 10);
});

test('Test fftshift', () => {
  expect(fftshift([0, 1, 2, 3, 4, 5, 6, 7])).toStrictEqual([
    4, 5, 6, 7, 0, 1, 2, 3,
  ]);
});

test('Test linear mapping of values from one range to another', () => {
  expect(linearMap(1, 0, 1, 10, 20)).toStrictEqual(20);
  expect(linearMap(0, 0, 1, 10, 20)).toStrictEqual(10);
  expect(linearMap(-1, 0, 1, 10, 20)).toStrictEqual(0);
  expect(linearMap(1, 1, 0, 10, 20)).toStrictEqual(10);
  expect(linearMap(15, 10, 20, 0, 1)).toStrictEqual(0.5);
});

test('Test generation of evenly spaced samples over intervals with possible discontinuity', () => {
  //continuous intervals
  expect(
    computeEvenlySpacedSamplesOnSet(4, [bignumber(0), bignumber(3)])
  ).toStrictEqual([bignumber(0), bignumber(1), bignumber(2), bignumber(3)]);
  expect(
    computeEvenlySpacedSamplesOnSet(4, [bignumber(0), bignumber(1.5)])
  ).toStrictEqual([bignumber(0), bignumber(0.5), bignumber(1), bignumber(1.5)]);
  expect(
    computeEvenlySpacedSamplesOnSet(5, [bignumber(0), bignumber(3)])
  ).toStrictEqual([
    bignumber(0),
    bignumber(0.75),
    bignumber(1.5),
    bignumber(2.25),
    bignumber(3),
  ]);
  expect(
    computeEvenlySpacedSamplesOnSet(5, [bignumber(0), bignumber(1.5)])
  ).toStrictEqual([
    bignumber(0),
    bignumber(0.375),
    bignumber(0.75),
    bignumber(1.125),
    bignumber(1.5),
  ]);

  //discontinuous intervals
  expect(
    computeEvenlySpacedSamplesOnSet(5, [
      bignumber(0),
      bignumber(1),
      bignumber(2),
      bignumber(3),
    ])
  ).toStrictEqual([
    bignumber(0),
    bignumber(0.5),
    bignumber(1),
    bignumber(2.5),
    bignumber(3),
  ]);
  expect(
    computeEvenlySpacedSamplesOnSet(6, [
      bignumber(0),
      bignumber(1),
      bignumber(2.5),
      bignumber(3),
    ])
  ).toStrictEqual([
    bignumber(0),
    bignumber(0.3),
    bignumber(0.6),
    bignumber(0.9),
    bignumber(2.7),
    bignumber(3),
  ]);
});

test('Test filter response measuring error handling', () => {
  expect(() => measureFilterResponse([1], [1])).toThrowError(
    'Invalid number of band edges!'
  );
});

test('Test filter response measuring for moving average filter', () => {
  const movingAverageFilterTotalResponse = measureFilterResponse(
    [0.25, 0.25, 0.25, 0.25],
    [-0.5, 0.5]
  );
  expect(movingAverageFilterTotalResponse[0]['minValue']).toStrictEqual(
    -Infinity
  );
  expect(movingAverageFilterTotalResponse[0]['maxValue']).toBeCloseTo(0);

  const movingAverageFilterBandResponse = measureFilterResponse(
    [0.25, 0.25, 0.25, 0.25],
    [0, 0.2, 0.3, 0.4]
  );
  expect(movingAverageFilterBandResponse[0]['minValue']).toBeCloseTo(-12.04073);
  expect(movingAverageFilterBandResponse[0]['maxValue']).toBeCloseTo(0);
  expect(movingAverageFilterBandResponse[1]['minValue']).toBeCloseTo(-14.81597);
  expect(movingAverageFilterBandResponse[1]['maxValue']).toBeCloseTo(-11.30333);

  const movingAverageFilterNegativeBandResponse = measureFilterResponse(
    [0.25, 0.25, 0.25, 0.25],
    [-0.5, -0.3, -0.1, 0.1, 0.2, 0.3]
  );
  expect(movingAverageFilterNegativeBandResponse[0]['minValue']).toStrictEqual(
    -Infinity
  );
  expect(movingAverageFilterNegativeBandResponse[0]['maxValue']).toBeCloseTo(
    -11.30333
  );
  expect(movingAverageFilterNegativeBandResponse[1]['minValue']).toBeCloseTo(
    -2.276599
  );
  expect(movingAverageFilterNegativeBandResponse[1]['maxValue']).toBeCloseTo(0);
  expect(movingAverageFilterNegativeBandResponse[2]['minValue']).toStrictEqual(
    -Infinity
  );
  expect(movingAverageFilterNegativeBandResponse[2]['maxValue']).toBeCloseTo(
    -12.04119
  );
});
