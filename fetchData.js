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
      councilName,
      // councilSlug: Not present, calculated from councilName on frontend

      // councilIsCityCouncil: Minified into number [0,1]
      Number(councilIsCityCouncil),
    ];
  });
  fs.writeFileSync("./public/data/cases.json", JSON.stringify(cases));
}

fetchData();
