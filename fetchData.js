const fetch = require("cross-fetch");
const fs = require("fs");
const parse = require("csv-parse/lib/sync");
const dayjs = require("dayjs");
dayjs.extend(require("dayjs/plugin/utc"));
dayjs.extend(require("dayjs/plugin/timezone"));
const populationByPostcode = require("./src/data/population/populationByPostcode.json");
const populationByCouncil = require("./src/data/population/populationByCouncil.json");
// Constants copied from src/constants.js
const SOURCE_TIMEZONE = "Australia/Sydney";
const SPECIAL_COUNCILS = ["Correctional settings", "Hotel Quarantine"];
// Other constants
const CASES_URL =
  "https://data.nsw.gov.au/data/dataset/aefcde60-3b0c-4bc0-9af1-6fe652944ec2/resource/5d63b527-e2b8-4c42-ad6f-677f14433520/download/confirmed_cases_table1_location_agg.csv";
const CASES_META_URL =
  "https://data.nsw.gov.au/data/api/3/action/package_show?id=aefcde60-3b0c-4bc0-9af1-6fe652944ec2";
// For testing - Setting TO_DATE to a YYYY-MM-DD string allows us to teleport back in time to then
const TO_DATE = null;

async function fetchData() {
  console.time("Fetch cases endpoints");
  let [modified, csv] = await Promise.all([
    fetch(CASES_META_URL)
      .then((r) => r.json())
      .then(({ result }) => result.metadata_modified + "Z"),
    fetch(CASES_URL).then((r) => r.text()),
  ]);
  console.timeEnd("Fetch cases endpoints");

  console.time("Parse cases CSV");
  const rows = parse(csv, { columns: true }).filter(
    (row) =>
      postcodeIsValid(row.postcode) &&
      (!TO_DATE || row.notification_date <= TO_DATE)
  );
  console.timeEnd("Parse cases CSV");

  console.time("Generate casesAsOf.json + cases_modified.txt");

  const temporalCoverageTo = dayjs(
    rows.map((c) => c.notification_date).sort()[rows.length - 1]
  ).tz(SOURCE_TIMEZONE);

  fs.writeFileSync(
    "./src/data/built/casesAsOf.json",
    JSON.stringify({ metadataModified: modified, temporalCoverageTo })
  );
  fs.writeFileSync("./public/data/cases_modified.txt", modified);

  console.timeEnd("Generate casesAsOf.json + cases_modified.txt");

  // Calculate postcodes
  console.time("Generate postcodes.json");
  const postcodes = uniqSortedByFreq(rows.map((c) => c.postcode)).map((p) =>
    Number(p)
  );
  // Write postcodes.json at end of file, after appending during vaccinations step
  console.timeEnd("Generate postcodes.json");

  // Calculate councilNames
  console.time("Generate councilNames.json");
  const councilNames = uniqSortedByFreq(
    rows.map((c) => processCouncilName(c.lga_name19))
  );
  // Write councilNames.json at end of file, after appending during vaccinations step
  console.timeEnd("Generate councilNames.json");

  // Calculate cases
  console.time(
    "Generate postcodeDailyCases.json, councilDailyCases.json, cityCouncilIndices.json, postcodesForCouncil.json & councilsForPostcode.json"
  );
  const cityCouncilIndices = [];
  const postcodesForCouncil = new Array(councilNames.length)
    .fill(0)
    .map(() => new Set());
  const councilsForPostcode = new Array(postcodes.length)
    .fill(0)
    .map(() => new Set());
  const postcodeDailyCases = {};
  const councilDailyCases = {};

  rows.forEach((row) => {
    // COUNT STUFF
    const count = Number(row.confirmed_cases_count);

    // POSTCODE STUFF
    const postcode = Number(row.postcode);
    const postcodeIndex = postcodes.indexOf(postcode);

    // DATE STUFF
    const dateMin = getMinifiedDate(row);

    // COUNCIL STUFF
    const councilName = processCouncilName(row.lga_name19);
    const councilNameIndex = councilNames.indexOf(councilName);
    const councilIsCityCouncil = row.lga_name19.includes("(C)");

    // Quest: add to postcode & council daily counts
    if (postcodeIndex !== -1) {
      if (!postcodeDailyCases[postcodeIndex])
        postcodeDailyCases[postcodeIndex] = {};

      postcodeDailyCases[postcodeIndex][dateMin] =
        (postcodeDailyCases[postcodeIndex][dateMin] || 0) + count;
    }
    if (councilNameIndex !== -1) {
      if (!councilDailyCases[councilNameIndex])
        councilDailyCases[councilNameIndex] = {};

      councilDailyCases[councilNameIndex][dateMin] =
        (councilDailyCases[councilNameIndex][dateMin] || 0) + count;
    }

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
      !SPECIAL_COUNCILS.includes(councilName)
    )
      councilsForPostcode[postcodeIndex].add(councilNameIndex);
  });

  fs.writeFileSync(
    "./src/data/built/postcodeDailyCases.json",
    JSON.stringify(postcodeDailyCases)
  );
  fs.writeFileSync(
    "./src/data/built/councilDailyCases.json",
    JSON.stringify(councilDailyCases)
  );
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
    "Generate postcodeDailyCases.json, councilDailyCases.json, cityCouncilIndices.json, postcodesForCouncil.json & councilsForPostcode.json"
  );

  console.time("Generate postcodeCounts.json + postcodeTable.csv");
  const postcodeCounts = getCounts(
    "postcode",
    temporalCoverageTo,
    rows,
    postcodes,
    councilNames
  );
  fs.writeFileSync(
    "./src/data/built/postcodeCounts.json",
    JSON.stringify(postcodeCounts)
  );
  fs.writeFileSync(
    "./public/data/postcodeTable.csv",
    countsToCsv(
      postcodeCounts,
      "Postcode",
      postcodes,
      populationByPostcode,
      temporalCoverageTo
    )
  );
  console.timeEnd("Generate postcodeCounts.json + postcodeTable.csv");

  console.time("Generate councilCounts.json + councilTable.csv");
  const councilCounts = getCounts(
    "councilName",
    temporalCoverageTo,
    rows,
    postcodes,
    councilNames
  );
  fs.writeFileSync(
    "./src/data/built/councilCounts.json",
    JSON.stringify(councilCounts)
  );
  fs.writeFileSync(
    "./public/data/councilTable.csv",
    countsToCsv(
      councilCounts,
      "Council",
      councilNames,
      populationByCouncil,
      temporalCoverageTo
    )
  );
  console.timeEnd("Generate councilCounts.json + councilTable.csv");

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
    thirdDose16Plus:
      (mostRecentAirData.AIR_NSW_18_PLUS_THIRD_DOSE_COUNT /
        mostRecentAirData.AIR_NSW_16_PLUS_POPULATION) *
      100,
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
  temporalCoverageTo,
  rows,
  postcodes,
  councilNames
) {
  // Initialise objects
  const totalCases = {};
  const newCasesThisWeek = {};

  // Calculate dates to compare to
  const oneWeekAgo = temporalCoverageTo
    .subtract(7, "days")
    .format("YYYY-MM-DD");

  // Iterate through each case
  rows.forEach((row) => {
    const identifier =
      identifierKey === "councilName"
        ? councilNames.indexOf(processCouncilName(row.lga_name19))
        : postcodes.indexOf(Number(row.postcode));

    const count = Number(row.confirmed_cases_count);

    // Add the case to its postcode/council's total cases
    totalCases[identifier] = (totalCases[identifier] || 0) + count;

    // If the case is this week, add to This Week col
    if (row.notification_date > oneWeekAgo)
      newCasesThisWeek[identifier] =
        (newCasesThisWeek[identifier] || 0) + count;
  });
  return { totalCases, newCasesThisWeek };
}

function countsToCsv(
  counts,
  identifierHeader,
  identifiers,
  populationByIdentifier,
  temporalCoverageTo
) {
  const PER_POPULATION = 100;

  // Headers
  let csv =
    [
      identifierHeader,
      "This week",
      "Total cases",
      `This week (per ${PER_POPULATION} ppl)`,
      `Total cases (per ${PER_POPULATION} ppl)`,
    ].join(",") + "\n";

  // Rows
  csv += identifiers
    .map((identifier, index) => {
      const population = populationByIdentifier[identifier];
      const multiplier = PER_POPULATION / population;
      const thisWeek = counts.newCasesThisWeek[index] || 0;
      const total = counts.totalCases[index] || 0;
      // Return cells
      return [
        identifier,
        thisWeek,
        total,
        ...(isNaN(multiplier)
          ? new Array(2).fill("No population")
          : [thisWeek * multiplier, total * multiplier]),
      ];
    })
    .sort((a, b) => a[0] - b[0]) // Sort by col1
    .map((cells) => cells.join(",")) // Join cells to form row
    .join("\n");

  return csv;
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
