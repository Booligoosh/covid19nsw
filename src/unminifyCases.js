import dates from "@/data/built/dates.json";
import { SOURCE_STRINGS } from "./constants";

export default function (casesMin) {
  console.time("Transform parsed JSON");
  const cases = casesMin.map(([p, d, s, c]) => ({
    postcodeIndex: p,
    rawDate: `202${dates[d].substr(0, 1)}-${dates[d].substr(1, 2)}-${dates[
      d
    ].substr(3, 2)}`,
    source: SOURCE_STRINGS[s],
    councilNameIndex: c,
  }));
  console.timeEnd("Transform parsed JSON");
  return cases;
}
