const array = JSON.parse(
  require("fs").readFileSync(__dirname + "/suburbListNSW.json")
);
const postcodeNumbers = [...new Set(array.map((x) => x.POSTCODE))].sort(
  (a, b) => a - b
);

const obj = {};
postcodeNumbers.forEach(
  (postcode) =>
    (obj[postcode] = array
      .filter(({ POSTCODE }) => POSTCODE === postcode)
      .map((x) => x.NAME))
);
const final = JSON.stringify(obj);

require("fs").writeFileSync(__dirname + "/suburbsForPostcode.json", final);
