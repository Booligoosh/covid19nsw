const fetch = require("cross-fetch");
const fs = require("fs");
const parse = require("csv-parse/lib/sync");

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

  const parsed = parse(csv, {
    columns: true,
  });

  // Calculate postcodes
  const postcodes = [...new Set(parsed.map((c) => Number(c.postcode)))]
    .filter((c) => !!c)
    .filter(
      // Based on https://en.wikipedia.org/wiki/Postcodes_in_Australia#Australian_states_and_territories
      (postcode) =>
        (postcode >= 2000 && postcode <= 2599) ||
        (postcode >= 2619 && postcode <= 2899) ||
        (postcode >= 2921 && postcode <= 2999)
    );
  fs.writeFileSync(
    "./src/data/built/postcodes.json",
    JSON.stringify(postcodes)
  );

  // Calculate councilNames
  const councilNames = [
    ...new Set(parsed.map((c) => c.lga_name19.replace(/\(.+?\)/g, "").trim())),
  ].filter((c) => !!c);
  fs.writeFileSync(
    "./src/data/built/councilNames.json",
    JSON.stringify(councilNames)
  );

  // Calculate cases
  const cases = parsed.map((caseRow) => {
    const postcode = Number(caseRow.postcode);
    const rawDate = caseRow.notification_date;
    const councilName = caseRow.lga_name19.replace(/\(.+?\)/g, "").trim();
    const councilIsCityCouncil = caseRow.lga_name19.includes("(C)");
    const source = caseRow.likely_source_of_infection.startsWith(
      "Locally acquired"
    )
      ? "Local"
      : caseRow.likely_source_of_infection;
    return [
      // postcode
      postcode,
      // rawDate
      rawDate,
      // source: Minified into number [0,1,2]
      ["Local", "Interstate", "Overseas"].indexOf(source),
      // councilName
      councilNames.indexOf(councilName),
      // councilSlug: Not present, calculated from councilName on frontend

      // councilIsCityCouncil: Minified into number [0,1]
      Number(councilIsCityCouncil),
    ];
  });
  fs.writeFileSync(
    "./public/data/cases.json",
    JSON.stringify([modified, cases])
  );
}

fetchData();
