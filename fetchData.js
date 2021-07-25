const fetch = require("cross-fetch");
const fs = require("fs");

const CASES_URL =
  "https://data.nsw.gov.au/data/dataset/97ea2424-abaf-4f3e-a9f2-b5c883f42b6a/resource/2776dbb8-f807-4fb2-b1ed-184a6fc2c8aa/download/covid-19-cases-by-notification-date-location-and-likely-source-of-infection.csv";
const CASES_META_URL =
  "https://data.nsw.gov.au/data/api/3/action/package_show?id=97ea2424-abaf-4f3e-a9f2-b5c883f42b6a";

async function fetchData() {
  const [modified, csv] = await Promise.all([
    fetch(CASES_META_URL)
      .then((r) => r.json())
      .then(({ result }) => result.metadata_modified),
    fetch(CASES_URL).then((r) => r.text()),
  ]);

  fs.writeFileSync("./public/data/cases_modified.txt", modified);
  // Write as .css instead of .csv so that Netlify will apply compression
  fs.writeFileSync("./public/data/cases.css", csv);
}

fetchData();
