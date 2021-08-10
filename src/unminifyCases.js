import councilNames from "@/data/built/councilNames.json";
import postcodes from "@/data/built/postcodes.json";
import dates from "@/data/built/dates.json";

export default function (casesMin) {
  console.time("Transform parsed JSON");
  const cases = casesMin.map(([p, d, s, x, y]) => ({
    postcode: postcodes[p],
    rawDate: `202${dates[d].substr(0, 1)}-${dates[d].substr(1, 2)}-${dates[
      d
    ].substr(3, 2)}`,
    source: ["Local", "Interstate", "Overseas"][s],
    councilName: councilNames[x],
    councilSlug: councilNames[x]?.replace(/ /g, "-").toLowerCase(),
    councilIsCityCouncil: !!y,
  }));
  console.timeEnd("Transform parsed JSON");
  return cases;
}
