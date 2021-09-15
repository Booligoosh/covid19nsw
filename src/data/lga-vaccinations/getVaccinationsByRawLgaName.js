// Returns data in format like so:
// {
//   'Albury (C)': [ '69.8%', '40.2%' ],
//   'Armidale Regional (A)': [ '68.9%', '42.6%' ],
//   'Ballina (A)': [ '73.2%', '45.3%' ],
//   ...
// }

module.exports = () => {
  const xlsx = require("xlsx");
  const FILE_NAME = "source.xlsx";
  const RANGE = "A9:F9999";
  const STATE_NAME = "New South Wales";
  const STATE_NAME_HEADER = "Jurisdiction";
  const LGA_NAME_HEADER = "LGA Name";
  const DOSE_1_HEADER = "Dose 1 % coverage of 15+";
  const DOSE_2_HEADER = "Dose 2 % coverage of 15+";
  const DECIMAL_PLACES = 1;

  const file = xlsx.readFile(__dirname + "/" + FILE_NAME);

  const vaccinationsByRawLgaName = {};
  xlsx.utils
    .sheet_to_json(file.Sheets[file.SheetNames[0]], {
      range: RANGE,
    })
    .forEach((row) => {
      const state = row[STATE_NAME_HEADER];
      if (state === STATE_NAME) {
        const lgaName = row[LGA_NAME_HEADER];
        const firstDosePct = row[DOSE_1_HEADER];
        const secondDosePct = row[DOSE_2_HEADER];

        if (
          typeof firstDosePct === "number" &&
          typeof secondDosePct === "number"
        )
          vaccinationsByRawLgaName[lgaName] = [
            (firstDosePct * 100).toFixed(DECIMAL_PLACES) + "%",
            (secondDosePct * 100).toFixed(DECIMAL_PLACES) + "%",
          ];
      }
    });

  return vaccinationsByRawLgaName;
};
