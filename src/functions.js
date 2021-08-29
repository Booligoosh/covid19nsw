export function getVaccineRangeIndex(rangeString) {
  if (!rangeString) return -1;
  const rangeStart = rangeString.match(/.+?\d*/)?.[0]; // Matches the first number and any characters before
  return ["0", "10", "20", "30", "40", "50", "60", "70", "80", "90"].indexOf(
    rangeStart
  );
}
