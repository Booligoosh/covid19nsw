import councilNames from "@/data/built/councilNames.json";
import cityCouncilIndices from "@/data/built/cityCouncilIndices.json";
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

export function getCouncilDisplayName(councilNameIndex) {
  const councilName = councilNames[councilNameIndex];
  if (councilName === "Correctional settings") return councilName;
  return `${councilName}${
    cityCouncilIndices.includes(councilNameIndex) ? " City" : ""
  } Council`;
}
