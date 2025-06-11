import { expect, test } from 'vitest';
import {
  calcKaiserBeta,
  calcKaiserWindow,
  createKaiserFilter,
  createValidatedKaiserFilter,
  estimateKaiserTapCount,
} from './filterDesignFunctions';
import { bignumber, number } from 'mathjs';
import { testArraysClose } from './testUtils';
import { testFilterResponseAgainstSpec } from './commonMath';

test('Test Kaiser window calculation', () => {
  testArraysClose(
    number(calcKaiserWindow(0, 10, 1000, bignumber(`1.0e-${14}`))) as number[],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  );
  testArraysClose(
    number(
      calcKaiserWindow(0.5, 10, 1000, bignumber(`1.0e-${14}`))
    ) as number[],
    [
      0.94030619, 0.96366734, 0.98137773, 0.99327547, 0.99925169, 0.99925169,
      0.99327547, 0.98137773, 0.96366734, 0.94030619,
    ]
  );
  testArraysClose(
    number(calcKaiserWindow(1, 10, 1000, bignumber(`1.0e-${14}`))) as number[],
    [
      0.78984831, 0.86980546, 0.93237871, 0.97536552, 0.99724655, 0.99724655,
      0.97536552, 0.93237871, 0.86980546, 0.78984831,
    ]
  );
  testArraysClose(
    number(calcKaiserWindow(0, 15, 1000, bignumber(`1.0e-${14}`))) as number[],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  );
  testArraysClose(
    number(
      calcKaiserWindow(0.5, 15, 1000, bignumber(`1.0e-${14}`))
    ) as number[],
    [
      0.94030619, 0.95596276, 0.96931212, 0.98030385, 0.9888964, 0.99505727,
      0.99876315, 1, 0.99876315, 0.99505727, 0.9888964, 0.98030385, 0.96931212,
      0.95596276, 0.94030619,
    ]
  );
  testArraysClose(
    number(calcKaiserWindow(1, 15, 1000, bignumber(`1.0e-${14}`))) as number[],
    [
      0.78984831, 0.84311132, 0.88956572, 0.92853637, 0.9594549, 0.98186912,
      0.99545058, 1, 0.99545058, 0.98186912, 0.9594549, 0.92853637, 0.88956572,
      0.84311132, 0.78984831,
    ]
  );
});

test('Test Kaiser beta value generation', () => {
  expect(calcKaiserBeta(0)).toBeCloseTo(0);
  expect(calcKaiserBeta(-1)).toBeCloseTo(0);
  expect(calcKaiserBeta(1)).toBeCloseTo(0);
  expect(calcKaiserBeta(21)).toBeCloseTo(0);
  expect(calcKaiserBeta(22)).toBeCloseTo(0.66306);
  expect(calcKaiserBeta(50)).toBeCloseTo(4.533514121);
  expect(calcKaiserBeta(50.1)).toBeCloseTo(4.56228);
  expect(calcKaiserBeta(51)).toBeCloseTo(4.66146);
});

test('Test Kaiser tap count estimate', () => {
  expect(estimateKaiserTapCount(0, 0.1)).toBe(7);
  expect(estimateKaiserTapCount(10, 0.1)).toBe(3);
  expect(estimateKaiserTapCount(50, 0.1)).toBe(31);
  expect(estimateKaiserTapCount(80, 0.1)).toBe(53);
  expect(estimateKaiserTapCount(80, 0.05)).toBe(103);
});

test('Compare lowpass Kaiser output with known values', () => {
  testArraysClose(
    number(
      createKaiserFilter('lowpass', 'real', {
        cutoffFreq: 0.25,
        transitionBandwidth: 0.1,
        minStopbandAttenuation: 60,
        maxPassbandRipple: 0.1,
        besselMaxIterations: 1000,
      })
    ) as number[],
    [
      -0.000341660358758696, 0.000000000000000001, 0.001280145288926233,
      -0.000000000000000002, -0.003112851035778237, 0.000000000000000004,
      0.006275882317150588, -0.000000000000000006, -0.011359851511041593,
      0.000000000000000009, 0.019275135606203555, -0.000000000000000012,
      -0.03175777821468162, 0.000000000000000015, 0.053162475901186709,
      -0.000000000000000017, -0.099505973567768677, 0.000000000000000019,
      0.316072346004351412, 0.500024259140420702, 0.316072346004351412,
      0.000000000000000019, -0.099505973567768677, -0.000000000000000017,
      0.053162475901186709, 0.000000000000000015, -0.03175777821468162,
      -0.000000000000000012, 0.019275135606203569, 0.000000000000000009,
      -0.011359851511041593, -0.000000000000000006, 0.006275882317150588,
      0.000000000000000004, -0.003112851035778237, -0.000000000000000002,
      0.001280145288926234, 0.000000000000000001, -0.000341660358758696,
    ]
  );
});

test('Test lowpass Kaiser filter response', () => {
  const lowpassMeasurementResults = testFilterResponseAgainstSpec(
    number(
      createKaiserFilter('lowpass', 'real', {
        cutoffFreq: 0.25,
        transitionBandwidth: 0.1,
        minStopbandAttenuation: 60,
        maxPassbandRipple: 0.1,
        besselMaxIterations: 10,
      })
    ) as number[],
    [0, 0.25 - 0.1 / 2],
    [0.25 + 0.1 / 2, 0.5],
    [0.1],
    [-60]
  );
  expect(lowpassMeasurementResults.specMet).toBe(false);
  expect(lowpassMeasurementResults.failureReason).toBe('stopband');
  expect(
    lowpassMeasurementResults.filterPassbandResponse[0].minValue
  ).toBeGreaterThan(-0.1);
  expect(
    lowpassMeasurementResults.filterPassbandResponse[0].maxValue
  ).toBeLessThan(0.1);

  const validatedLowpassFilter = createValidatedKaiserFilter(
    'lowpass',
    'real',
    'float64',
    {
      cutoffFreq: 0.25,
      transitionBandwidth: 0.1,
      minStopbandAttenuation: 60,
      maxPassbandRipple: 0.1,
      besselMaxIterations: 10,
    }
  );

  const validatedLowpassMeasurementResults = testFilterResponseAgainstSpec(
    validatedLowpassFilter.taps as number[],
    [0, 0.25 - 0.1 / 2],
    [0.25 + 0.1 / 2, 0.5],
    [0.1],
    [-60]
  );

  expect(validatedLowpassFilter.specificationMet).toBe(true);
  expect(validatedLowpassMeasurementResults.specMet).toBe(true);
});
