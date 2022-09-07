const fs = require("fs");
const parse = require("csv-parse/lib/sync");

const csv = fs.readFileSync(__dirname + "/sources/2021Census_G02_NSW_POA.csv");
const table = parse(csv, {
  columns: true,
});

const stats = {};

table.forEach((row) => {
  const postcode = Number(row.POA_CODE_2021.substr(3));
  // [median age,average household size]
  stats[postcode] = [
    Number(row.Median_age_persons),
    Number(row.Average_household_size),
  ];
});

require("fs").writeFileSync(
  __dirname + "/censusDataByPostcode.json",
  JSON.stringify(stats)
);
