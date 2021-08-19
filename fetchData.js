const fetch = require("cross-fetch");
const fs = require("fs");
const parse = require("csv-parse/lib/sync");
const dayjs = require("dayjs");
dayjs.extend(require("dayjs/plugin/utc"));
dayjs.extend(require("dayjs/plugin/timezone"));
const OUTBREAK_START_DATE = "2021-06-16";
const SOURCE_TIMEZONE = "Australia/Sydney";

const CASES_URL =
  "https://data.nsw.gov.au/data/dataset/97ea2424-abaf-4f3e-a9f2-b5c883f42b6a/resource/2776dbb8-f807-4fb2-b1ed-184a6fc2c8aa/download/covid-19-cases-by-notification-date-location-and-likely-source-of-infection.csv";
const CASES_META_URL =
  "https://data.nsw.gov.au/data/api/3/action/package_show?id=97ea2424-abaf-4f3e-a9f2-b5c883f42b6a";

async function fetchData() {
  console.time("Fetch cases endpoints");
  let [modified, csv] = await Promise.all([
    fetch(CASES_META_URL)
      .then((r) => r.json())
      .then(({ result }) => result.metadata_modified + "Z"),
    fetch(CASES_URL).then((r) => r.text()),
  ]);
  console.timeEnd("Fetch cases endpoints");

  console.time("Generate metadataModified.json + cases_modified.txt");
  fs.writeFileSync(
    "./src/data/built/metadataModified.json",
    JSON.stringify(modified)
  );
  fs.writeFileSync("./public/data/cases_modified.txt", modified);
  console.timeEnd("Generate metadataModified.json + cases_modified.txt");

  console.time("Parse cases CSV");
  const parsed = parse(csv, {
    columns: true,
  });
  console.timeEnd("Parse cases CSV");

  // Calculate postcodes
  console.time("Generate postcodes.json");
  const postcodes = [...new Set(parsed.map((c) => Number(c.postcode)))]
    .filter((c) => !!c)
    .filter(postcodeIsValid)
    // Sort so the most-used postcodes come first, leading to
    // less >1-digit postcode indicies in the cases.json file.
    .sort(
      (a, b) =>
        parsed.filter(({ postcode }) => postcode === b.toString()).length -
        parsed.filter(({ postcode }) => postcode === a.toString()).length
    );
  fs.writeFileSync(
    "./src/data/built/postcodes.json",
    JSON.stringify(postcodes)
  );
  console.timeEnd("Generate postcodes.json");

  // Calculate councilNames
  console.time("Generate councilNames.json");
  const councilNames = [
    ...new Set(parsed.map((c) => c.lga_name19.replace(/\(.+?\)/g, "").trim())),
  ].filter((c) => !!c);
  fs.writeFileSync(
    "./src/data/built/councilNames.json",
    JSON.stringify(councilNames)
  );
  console.timeEnd("Generate councilNames.json");

  // Calculate dates
  console.time("Generate dates.json");
  const dates = [...new Set(parsed.map(getMinifiedDate))]
    .filter((c) => !!c)
    // Sort so the most-used dates come first, leading to
    // less >1-digit dates indicies in the cases.json file.
    .sort(
      (a, b) =>
        parsed.filter((c) => getMinifiedDate(c) === b).length -
        parsed.filter((c) => getMinifiedDate(c) === a).length
    );
  fs.writeFileSync("./src/data/built/dates.json", JSON.stringify(dates));
  console.timeEnd("Generate dates.json");

  // Calculate cases
  console.time("Generate cases.json");
  const cases = parsed.filter(({ postcode }) => postcodeIsValid(postcode));
  const casesMin = cases.map((caseRow) => {
    const postcode = Number(caseRow.postcode);
    const councilName = caseRow.lga_name19.replace(/\(.+?\)/g, "").trim();
    const councilIsCityCouncil = caseRow.lga_name19.includes("(C)");
    const source = caseRow.likely_source_of_infection.startsWith(
      "Locally acquired"
    )
      ? "Local"
      : caseRow.likely_source_of_infection;
    return [
      // postcode
      postcodes.indexOf(postcode),
      // rawDate:
      // - "2020" replaced with "0", "2021" replaced with "1" etc.
      // - Dashes removed
      dates.indexOf(getMinifiedDate(caseRow)),
      // source: Minified into number [0,1,2]
      ["Local", "Interstate", "Overseas"].indexOf(source),
      // councilName
      councilNames.indexOf(councilName),
      // councilSlug: Not present, calculated from councilName on frontend

      // councilIsCityCouncil: Minified into number [0,1]
      Number(councilIsCityCouncil),
    ];
  });
  fs.writeFileSync("./src/data/built/cases.json", JSON.stringify(casesMin));
  console.timeEnd("Generate cases.json");

  console.time("Generate postcodeCounts.json");
  fs.writeFileSync(
    "./src/data/built/postcodeCounts.json",
    JSON.stringify(
      getCounts("postcode", modified, cases, postcodes, councilNames)
    )
  );
  console.timeEnd("Generate postcodeCounts.json");

  console.time("Generate councilCounts.json");
  fs.writeFileSync(
    "./src/data/built/councilCounts.json",
    JSON.stringify(
      getCounts("councilName", modified, cases, postcodes, councilNames)
    )
  );
  console.timeEnd("Generate councilCounts.json");

  // Calculate vaccinations
  console.time("Fetch vaccinations endpoint");
  const vaccinationData = await fetch(
    "https://nswdac-covid-19-postcode-heatmap.azurewebsites.net/datafiles/vaccination_metrics-v3.json"
  ).then((r) => r.json());
  console.timeEnd("Fetch vaccinations endpoint");
  console.time("Generate vaccinations.json");
  const vaccinationsByPostcode = {};
  Object.keys(vaccinationData).forEach((postcode) => {
    if (postcodeIsValid(postcode)) {
      const latestData = Object.values(vaccinationData[postcode]).slice(-1)[0];
      const dose1 = latestData.percPopAtLeastFirstDose10WidthRange;
      const dose2 = latestData.percPopFullyVaccinated10WidthRange;
      if (dose1 && dose2)
        vaccinationsByPostcode[postcode] = [
          dose1.replace("%-", "-"), // Replace "20%-30%"
          dose2.replace("%-", "-"), // with "20-30%" etc.
        ];
    }
  });
  fs.writeFileSync(
    "./src/data/built/vaccinations.json",
    JSON.stringify(vaccinationsByPostcode)
  );
  console.timeEnd("Generate vaccinations.json");
}

fetchData();

function postcodeIsValid(postcode) {
  // Based on https://en.wikipedia.org/wiki/Postcodes_in_Australia#Australian_states_and_territories
  return (
    (postcode >= 2000 && postcode <= 2599) ||
    (postcode >= 2619 && postcode <= 2899) ||
    (postcode >= 2921 && postcode <= 2999)
  );
}

function getMinifiedDate(c) {
  return c.notification_date.substr(3).replace(/-/g, "");
}

function getCounts(
  identifierKey,
  metadataModified,
  cases,
  postcodes,
  councilNames
) {
  const temporalCoverageTo = dayjs(metadataModified)
    .tz(SOURCE_TIMEZONE)
    .startOf("day")
    .subtract(1, "day");
  // Initialise objects
  // const totalCases = {};
  const outbreakTotalCases = {};
  const newCasesThisWeek = {};
  const newCasesToday = {};

  // Calculate dates to compare to
  const today = temporalCoverageTo.format("YYYY-MM-DD");
  const oneWeekAgo = temporalCoverageTo
    .subtract(7, "days")
    .format("YYYY-MM-DD");

  // Iterate through each case
  cases.forEach((caseRow) => {
    const identifier =
      identifierKey === "councilName"
        ? councilNames.indexOf(
            caseRow.lga_name19.replace(/\(.+?\)/g, "").trim()
          )
        : postcodes.indexOf(Number(caseRow.postcode));
    // Add the case to its postcode/council's total cases
    // totalCases[identifier] = (totalCases[identifier] || 0) + 1;

    // If the case is today, add to Today col
    if (caseRow.notification_date === today)
      newCasesToday[identifier] = (newCasesToday[identifier] || 0) + 1;

    // If the case is this week, add to This Week col
    if (caseRow.notification_date > oneWeekAgo)
      newCasesThisWeek[identifier] = (newCasesThisWeek[identifier] || 0) + 1;

    // If the case is this outbreak, Add to Outbreak col
    if (caseRow.notification_date > OUTBREAK_START_DATE)
      outbreakTotalCases[identifier] =
        (outbreakTotalCases[identifier] || 0) + 1;
  });
  return { outbreakTotalCases, newCasesThisWeek, newCasesToday };
}
