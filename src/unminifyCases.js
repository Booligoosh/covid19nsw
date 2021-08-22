import dates from "@/data/built/dates.json";

export default function (casesMin) {
  console.time("Transform parsed JSON");
  const cases = casesMin.map(
    ([postcodeIndex, d, sourceIndex, councilNameIndex]) => ({
      postcodeIndex,
      rawDate: `202${dates[d].substr(0, 1)}-${dates[d].substr(1, 2)}-${dates[
        d
      ].substr(3, 2)}`,
      sourceIndex,
      councilNameIndex,
    })
  );
  console.timeEnd("Transform parsed JSON");
  return cases;
}
