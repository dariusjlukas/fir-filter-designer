import { expect, test } from 'vitest';
import { stringIsValidNumber } from './util';

test('Test stringIsValidNumber', () => {
  expect(stringIsValidNumber('10')).toBe(true);
  expect(stringIsValidNumber('a')).toBe(false);
  expect(stringIsValidNumber('1.23456')).toBe(true);
  expect(stringIsValidNumber('1.23.4')).toBe(false);
  expect(stringIsValidNumber('')).toBe(false);
  expect(stringIsValidNumber('0')).toBe(true);
  expect(stringIsValidNumber('-1')).toBe(true);
  expect(stringIsValidNumber('-1.5')).toBe(true);
  expect(stringIsValidNumber('1-4')).toBe(false);
});
