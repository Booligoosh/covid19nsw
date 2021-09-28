import councilNames from "@/data/built/councilNames.json";
import cityCouncilIndices from "@/data/built/cityCouncilIndices.json";

// Returns 0 for 0-9%, 1 for 10-19%, 8 for 80-89%, 9 for 90%+ or 95%+, etc.
// Also works for exact council percentages, eg. Math.floor(85.6/10) is still 8
export function getVaccineRangeIndex(rangeString) {
  if (!rangeString) return -1;
  const rangeStart = rangeString.match(/^\d*/)?.[0]; // Matches the first number before non-digit characters
  return Math.floor(Number(rangeStart) / 10);
}

export function getCouncilDisplayName(councilNameIndex) {
  const councilName = councilNames[councilNameIndex];
  if (councilName === "Correctional settings") return councilName;
  return `${councilName}${
    cityCouncilIndices.includes(councilNameIndex) ? " City" : ""
  } Council`;
}
