const RANGE_STARTS = [
  "0",
  "10",
  "20",
  "30",
  "40",
  "50",
  "60",
  "70",
  "80",
  "90",
];

export function getVaccineRangeIndex(rangeString) {
  if (!rangeString) return -1;
  const rangeStart = rangeString.match(/.+?\d*/)?.[0]; // Matches the first number and any characters before
  let index = RANGE_STARTS.indexOf(rangeStart);

  if (index === -1) {
    // Assume it's a full percentage rather than a range
    const num = Number(rangeString.replace("%", ""));
    const rangeStart = (Math.floor(num / 10) * 10).toString();
    console.log({ rangeStart });
    index = RANGE_STARTS.indexOf(rangeStart);
  }

  return index;
}
