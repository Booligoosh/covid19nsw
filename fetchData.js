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
  // Write postcodes.json at end of file, after appending during vaccinations step
  console.timeEnd("Generate postcodes.json");

  // Calculate councilNames
  console.time("Generate councilNames.json");
  const councilNames = uniqSortedByFreq(
    cases.map((c) => processCouncilName(c.lga_name19))
  );
  // Write councilNames.json at end of file, after appending during vaccinations step
  console.timeEnd("Generate councilNames.json");

  // Calculate dates
  console.time("Generate dates.json");
  const dates = uniqSortedByFreq(cases.map(getMinifiedDate));
  fs.writeFileSync("./src/data/built/dates.json", JSON.stringify(dates));
  console.timeEnd("Generate dates.json");

  // Calculate cases
  console.time(
    "Generate cases.json, cityCouncilIndices.json, postcodesForCouncil.json & councilsForPostcode.json"
  );
  const cityCouncilIndices = [];
  const postcodesForCouncil = new Array(councilNames.length)
    .fill(0)
    .map(() => new Set());
  const councilsForPostcode = new Array(postcodes.length)
    .fill(0)
    .map(() => new Set());

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
            "Under initial investigation",
          ].includes(source)
        ? 1 // Unlinked local
        : ["Interstate", "Overseas"].includes(source)
        ? 2 // Outside NSW
        : -1; // Unknown string;
    if (sourceIndex === -1)
      console.warn("[WARNING] Unknown source string:", source);

    // COUNCIL STUFF
    const councilName = processCouncilName(caseRow.lga_name19);
    const councilNameIndex = councilNames.indexOf(councilName);
    const councilIsCityCouncil = caseRow.lga_name19.includes("(C)");

    // Side quest: add to cityCouncilIndices.json
    if (councilIsCityCouncil && !cityCouncilIndices.includes(councilNameIndex))
      cityCouncilIndices.push(councilNameIndex);

    // Side quest: add to postcodesForCouncil.json
    if (councilNameIndex !== -1)
      postcodesForCouncil[councilNameIndex].add(postcode);

    // Side quest: add to councilsForPostcode.json
    if (
      postcodeIndex !== -1 &&
      councilNameIndex !== -1 &&
      councilName !== "Correctional settings"
    )
      councilsForPostcode[postcodeIndex].add(councilNameIndex);

    // RETURN
    return [postcodeIndex, dateIndex, sourceIndex, councilNameIndex];
  });
  fs.writeFileSync("./src/data/built/cases.json", JSON.stringify(casesMin));
  fs.writeFileSync(
    "./src/data/built/cityCouncilIndices.json",
    JSON.stringify(cityCouncilIndices)
  );
  fs.writeFileSync(
    "./src/data/built/postcodesForCouncil.json",
    JSON.stringify(
      postcodesForCouncil.map((set) =>
        // Map to postcode indices
        Array.from(set)
          .sort()
          .map((postcode) => postcodes.indexOf(postcode))
      )
    )
  );
  fs.writeFileSync(
    "./src/data/built/councilsForPostcode.json",
    JSON.stringify(councilsForPostcode.map((set) => Array.from(set).sort()))
  );
  console.timeEnd(
    "Generate cases.json, cityCouncilIndices.json, postcodesForCouncil.json & councilsForPostcode.json"
  );

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

  // Calculate overall vaccinations
  console.time("Fetch AIR vaccinations endpoint");
  const airVaccinationData = await fetch(
    "https://vaccinedata.covid19nearme.com.au/data/air.json"
  ).then((r) => r.json());
  console.timeEnd("Fetch AIR vaccinations endpoint");
  console.time("Generate overallVaccinations.json");
  const mostRecentAirData = airVaccinationData[airVaccinationData.length - 1];
  const overallVaccinations = {
    asAt: mostRecentAirData.DATE_AS_AT,
    firstDose16Plus: mostRecentAirData.AIR_NSW_16_PLUS_FIRST_DOSE_PCT,
    secondDose16Plus: mostRecentAirData.AIR_NSW_16_PLUS_SECOND_DOSE_PCT,
  };
  fs.writeFileSync(
    "./src/data/built/overallVaccinations.json",
    JSON.stringify(overallVaccinations)
  );
  console.timeEnd("Generate overallVaccinations.json");

  // Calculate vaccinations by postcode/council
  console.time("Fetch postcode vaccinations endpoint");
  const postcodeVaccinationData = await fetch(
    "https://nswdac-covid-19-postcode-heatmap.azurewebsites.net/datafiles/vaccination_metrics-v3.json"
  ).then((r) => r.json());
  console.timeEnd("Fetch postcode vaccinations endpoint");

  console.time(
    "Generate postcodeVaccinations.json + postcodeVaccinationHistory.json"
  );
  const postcodeVaccinationsAsOf = Object.keys(postcodeVaccinationData[2000])
    .sort()
    .pop();

  const vaccinationsByPostcode = {};
  const vaccinationHistoryByPostcode = {};
  Object.keys(postcodeVaccinationData).forEach((postcode) => {
    postcode = Number(postcode);
    if (postcodeIsValid(postcode)) {
      const allData = postcodeVaccinationData[postcode];
      const latestData = allData[postcodeVaccinationsAsOf];
      const latestPercents = getPostcodePctsFromDateObj(latestData);
      if (latestPercents) {
        // Add to vaccinationsByPostcode
        vaccinationsByPostcode[postcode] = latestPercents;
        // Add to postcodes array if not there already
        if (!postcodes.includes(postcode)) postcodes.push(postcode);
        // Historical stuff
        let last1stDosePct = null;
        let last2ndDosePct = null;
        const dose1History = {};
        const dose2History = {};
        // History object:
        // {
        //   ...
        //   "Date reached (YYYY-MM-DD)": "20-30%",
        //   "Date reached (YYYY-MM-DD)": "30-40%",
        //   ...
        // }
        // Basically the same as the input date structure, but
        // only including the *first* date each new number was
        // reached to save file size
        for (const dateKey of Object.keys(allData).sort()) {
          const percents = getPostcodePctsFromDateObj(allData[dateKey]);
          if (percents) {
            const [dose1, dose2] = percents;
            if (dose1 && dose1 !== last1stDosePct) {
              dose1History[minifyDate(dateKey)] = getVaccineRangeIndex(dose1);
              last1stDosePct = dose1;
            }
            if (dose2 && dose2 !== last2ndDosePct) {
              dose2History[minifyDate(dateKey)] = getVaccineRangeIndex(dose2);
              last2ndDosePct = dose2;
            }
          }
        }
        vaccinationHistoryByPostcode[postcode] = [dose1History, dose2History];
      }
    }
  });
  fs.writeFileSync(
    "./src/data/built/postcodeVaccinations.json",
    JSON.stringify(vaccinationsByPostcode)
  );
  fs.writeFileSync(
    "./src/data/built/postcodeVaccinationHistory.json",
    JSON.stringify(vaccinationHistoryByPostcode)
  );
  console.timeEnd(
    "Generate postcodeVaccinations.json + postcodeVaccinationHistory.json"
  );

  console.time("Fetch council vaccinations endpoint");
  const councilVaccinationData = await fetch(
    "https://nswdac-covid-19-postcode-heatmap.azurewebsites.net/datafiles/lga_daily_vaccines.json"
  )
    .then((r) => r.json())
    .then((r) => r.data);
  console.timeEnd("Fetch council vaccinations endpoint");

  let councilVaccinationsAsOf = Object.keys(
    Object.values(councilVaccinationData)[0]
  )
    .sort()
    .pop();
  const spreadsheetAsOf = require("./src/data/lga-vaccinations/asOf.json");

  // If latest spreadsheet data is more recent than latest NSW Health
  // endpoint data, supplement that data with the latest spreadsheet values
  if (spreadsheetAsOf > councilVaccinationsAsOf) {
    console.time("Supplement NSW Health data with spreadsheet parsing");

    councilVaccinationsAsOf = spreadsheetAsOf;

    const vaccinationsByRawLgaName =
      require("./src/data/lga-vaccinations/getVaccinationsByRawLgaName")();

    Object.entries(vaccinationsByRawLgaName).forEach(([rawLgaName, data]) => {
      let objForRawLgaName = Object.values(councilVaccinationData).find(
        (councilObj) => Object.values(councilObj)[0].lga_name === rawLgaName
      );
      // if (!objForRawLgaName) {
      //   const key = Math.random();
      //   councilVaccinationData[key] = {};
      //   objForRawLgaName = councilVaccinationData[key];
      // }
      objForRawLgaName[spreadsheetAsOf] = {
        lga_name: rawLgaName,
        percPopAtLeastFirst_commonwealth: data[0],
        percPopFullyVaccinated_commonwealth: data[1],
      };
    });
    console.timeEnd("Supplement NSW Health data with spreadsheet parsing");
  }

  console.time(
    "Generate councilVaccinations.json + councilVaccinationHistory.json"
  );
  // Regular council vaccinations processing code
  const vaccinationsByCouncilIndex = {};
  const vaccinationHistoryByCouncilIndex = {};

  Object.values(councilVaccinationData).forEach((allData) => {
    const latestData = allData[councilVaccinationsAsOf];
    const latestPercents = getCouncilPctsFromDateObj(latestData);

    if (latestPercents) {
      const councilName = processCouncilName(latestData.lga_name);
      // Add to councilNames array if not there already
      if (!councilNames.includes(councilName)) councilNames.push(councilName);
      const councilNameIndex = councilNames.indexOf(councilName);
      // Add to vaccinationsByCouncilIndex
      vaccinationsByCouncilIndex[councilNameIndex] = latestPercents;
      // Historical stuff
      let last1stDosePct = null;
      let last2ndDosePct = null;
      const dose1History = {};
      const dose2History = {};
      for (const dateKey of Object.keys(allData).sort()) {
        const percents = getCouncilPctsFromDateObj(allData[dateKey]);
        if (percents) {
          const [dose1, dose2] = percents;
          if (dose1 && dose1 !== last1stDosePct) {
            dose1History[minifyDate(dateKey)] = Number(
              dose1.replace(/[+%]/g, "")
            );
            last1stDosePct = dose1;
          }
          if (dose2 && dose2 !== last2ndDosePct) {
            dose2History[minifyDate(dateKey)] = Number(
              dose2.replace(/[+%]/g, "")
            );
            last2ndDosePct = dose2;
          }
        }
      }
      vaccinationHistoryByCouncilIndex[councilNameIndex] = [
        dose1History,
        dose2History,
      ];
    }
  });
  fs.writeFileSync(
    "./src/data/built/councilVaccinations.json",
    JSON.stringify(vaccinationsByCouncilIndex)
  );
  fs.writeFileSync(
    "./src/data/built/councilVaccinationHistory.json",
    JSON.stringify(vaccinationHistoryByCouncilIndex)
  );
  console.timeEnd(
    "Generate councilVaccinations.json + councilVaccinationHistory.json"
  );

  // Write vaccinationsAsOf.json
  fs.writeFileSync(
    "./src/data/built/vaccinationsAsOf.json",
    JSON.stringify({ postcodeVaccinationsAsOf, councilVaccinationsAsOf })
  );

  // Write postcodes.json
  fs.writeFileSync(
    "./src/data/built/postcodes.json",
    JSON.stringify(postcodes)
  );
  // Write councilNames.json
  fs.writeFileSync(
    "./src/data/built/councilNames.json",
    JSON.stringify(councilNames)
  );
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

function processCouncilName(rawCouncilName) {
  return rawCouncilName.replace(/\(.+?\)/g, "").trim();
}

function getMinifiedDate(c) {
  return minifyDate(c.notification_date);
}

function minifyDate(dateString) {
  // - "2020" replaced with "0", "2021" replaced with "1" etc.
  // - Dashes removed
  return dateString.substr(3).replace(/-/g, "");
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
        ? councilNames.indexOf(processCouncilName(caseRow.lga_name19))
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

function processVaccinePct(str) {
  if (!str || str === "suppressed") return null;
  return (
    str
      // - Replace "20%-30%" with "20-30%" etc
      .replace("%-", "-")
      // - Replace "<10%" with "0-9%"
      .replace("<10%", "0-9%")
      // - Replace ">95%" with "95%+"
      .replace(">95%", "95%+")
      // - Replace "95.0%" with "95%+" as "95%+" implies inclusivity
      .replace("95.0%", "95%+")
  );
}

function getPostcodePctsFromDateObj(dateObj) {
  // dateObj is the object for each date
  if (!dateObj) return null;
  const dose1 = processVaccinePct(dateObj.percPopAtLeastFirstDose10WidthRange);
  const dose2 = processVaccinePct(dateObj.percPopFullyVaccinated10WidthRange);
  if (dose1 && dose2) return [dose1, dose2];
  else return null;
}

function getCouncilPctsFromDateObj(dateObj) {
  // dateObj is the object for each date
  if (!dateObj) return null;
  const dose1 = processVaccinePct(dateObj.percPopAtLeastFirst_commonwealth);
  const dose2 = processVaccinePct(dateObj.percPopFullyVaccinated_commonwealth);
  if (dose1 && dose2) return [dose1, dose2];
  else return null;
}

// Also in src/functions.js, make sure to update both at once
function getVaccineRangeIndex(rangeString) {
  if (!rangeString) return -1;
  const rangeStart = rangeString.match(/^\d*/)[0]; // Matches the first number before non-digit characters
  return Math.floor(Number(rangeStart) / 10);
}
