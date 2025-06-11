import { expect } from 'vitest';

export const testArraysClose = (
  actual: number[],
  expected: number[],
  tolerance = 0.001
) => {
  expect(actual.length).toEqual(expected.length);
  actual.forEach((value, index) => {
    expect(value).toBeCloseTo(expected[index], tolerance);
  });
};
