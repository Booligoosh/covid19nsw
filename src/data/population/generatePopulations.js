const xlsx = require("xlsx");

// File is "Population estimates by age, by selected geographies, 2020", Downloaded on 14/09/2021
// From https://www.abs.gov.au/statistics/people/population/regional-population-age-and-sex/2020#data-download
const FILE_NAME = "32350DS0005_2020.xls";
const POSTCODES_TABLE = "Table 3";
const COUNCILS_TABLE = "Table 2";
const NSW_STATE_ID = 1;

const file = xlsx.readFile(__dirname + "/" + FILE_NAME);

// Generate postcode populations
const populationByPostcode = {};
xlsx.utils
  .sheet_to_json(file.Sheets[POSTCODES_TABLE], {
    range: "A10:V9999",
  })
  .forEach((row) => {
    const stateId = row.__EMPTY;
    if (stateId === NSW_STATE_ID) {
      const postcode = row.__EMPTY_2;
      const totalPop = row.__EMPTY_21;
      populationByPostcode[postcode] = totalPop;
    }
  });
require("fs").writeFileSync(
  __dirname + "/populationByPostcode.json",
  JSON.stringify(populationByPostcode)
);

// Generate council populations
const populationByCouncil = {};
xlsx.utils
  .sheet_to_json(file.Sheets[COUNCILS_TABLE], {
    range: "A9:W9999",
  })
  .forEach((row) => {
    const stateId = row.__EMPTY;
    if (stateId === NSW_STATE_ID) {
      const councilName = row.__EMPTY_3.replace(/\(.+?\)/g, "").trim();
      const totalPop = row.__EMPTY_22;
      populationByCouncil[councilName] = totalPop;
    }
  });

require("fs").writeFileSync(
  __dirname + "/populationByCouncil.json",
  JSON.stringify(populationByCouncil)
);
