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
  const cases = parsed.filter(({ postcode }) => postcodeIsValid(postcode));
  console.timeEnd("Parse cases CSV");

  // Calculate postcodes
  console.time("Generate postcodes.json");
  const postcodes = uniqSortedByFreq(cases.map((c) => c.postcode)).map((p) =>
    Number(p)
  );
  fs.writeFileSync(
    "./src/data/built/postcodes.json",
    JSON.stringify(postcodes)
  );
  console.timeEnd("Generate postcodes.json");

  // Calculate councilNames
  console.time("Generate councilNames.json");
  const councilNames = uniqSortedByFreq(
    cases.map((c) => c.lga_name19.replace(/\(.+?\)/g, "").trim())
  );
  fs.writeFileSync(
    "./src/data/built/councilNames.json",
    JSON.stringify(councilNames)
  );
  console.timeEnd("Generate councilNames.json");

  // Calculate dates
  console.time("Generate dates.json");
  const dates = uniqSortedByFreq(cases.map(getMinifiedDate));
  fs.writeFileSync("./src/data/built/dates.json", JSON.stringify(dates));
  console.timeEnd("Generate dates.json");

  // Calculate cases
  console.time("Generate cases.json + cityCouncilIndices.json");
  const cityCouncilIndices = [];
  const casesMin = cases.map((caseRow) => {
    // POSTCODE STUFF
    const postcode = Number(caseRow.postcode);
    const postcodeIndex = postcodes.indexOf(postcode);

    // DATE STUFF
    const dateIndex = dates.indexOf(getMinifiedDate(caseRow));

    // SOURCE STUFF
    const source = caseRow.likely_source_of_infection;
    const sourceIndex =
      source === "Locally acquired - linked to known case or cluster"
        ? 0 // Linked local
        : [
            "Locally acquired - no links to known case or cluster",
            "Locally acquired - investigation ongoing",
          ].includes(source)
        ? 1 // Unlinked local
        : ["Interstate", "Overseas"].includes(source)
        ? 2 // Outside NSW
        : -1; // Unknown string;
    if (sourceIndex === -1)
      console.warn("[WARNING] Unknown source string:", source);

    // COUNCIL STUFF
    const councilName = caseRow.lga_name19.replace(/\(.+?\)/g, "").trim();
    const councilNameIndex = councilNames.indexOf(councilName);
    const councilIsCityCouncil = caseRow.lga_name19.includes("(C)");

    if (councilIsCityCouncil && !cityCouncilIndices.includes(councilNameIndex))
      cityCouncilIndices.push(councilNameIndex);

    // RETURN
    return [postcodeIndex, dateIndex, sourceIndex, councilNameIndex];
  });
  fs.writeFileSync("./src/data/built/cases.json", JSON.stringify(casesMin));
  fs.writeFileSync(
    "./src/data/built/cityCouncilIndices.json",
    JSON.stringify(cityCouncilIndices)
  );
  console.timeEnd("Generate cases.json + cityCouncilIndices.json");

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
      if (dose1 && dose1 !== "suppressed" && dose2 && dose2 !== "suppressed")
        vaccinationsByPostcode[postcode] = [
          // Replace "20%-30%" with "20-30%" etc, replace "<10%" with "0-9%"
          dose1.replace("%-", "-").replace("<10%", "0-9%"),
          dose2.replace("%-", "-").replace("<10%", "0-9%"),
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
  // - "2020" replaced with "0", "2021" replaced with "1" etc.
  // - Dashes removed
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

function uniqSortedByFreq(array) {
  // Inspired by https://stackoverflow.com/a/63427870
  const freqs = array.reduce((freqs, value) => {
    if (value) freqs[value] = (freqs[value] || 0) + 1;
    return freqs;
  }, {});
  return Object.keys(freqs).sort((a, b) => freqs[b] - freqs[a]);
}
