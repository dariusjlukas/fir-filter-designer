export const stringIsValidNumber = (input: string) =>
  !isNaN(Number(input)) && !isNaN(parseFloat(input));
