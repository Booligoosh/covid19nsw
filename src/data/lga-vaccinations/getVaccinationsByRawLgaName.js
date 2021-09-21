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
  const STATE_NAME_HEADER = "State of Residence";
  const LGA_NAME_HEADER = "LGA 2019 Name of Residence";
  const DOSE_1_HEADER = "% Received dose 1 REMOTE_FLAGGED";
  const DOSE_2_HEADER = "% Received dose 2 REMOTE_FLAGGED";

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

        if (firstDosePct !== "N/A" && secondDosePct !== "N/A")
          vaccinationsByRawLgaName[lgaName] = [firstDosePct, secondDosePct];
      }
    });

  return vaccinationsByRawLgaName;
};
