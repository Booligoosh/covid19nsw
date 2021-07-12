const array = JSON.parse(
  require("fs").readFileSync(__dirname + "/suburbListNamePostcodeOnlyNSW.json")
);
const postcodeNumbers = [...new Set(array.map((x) => x.p))].sort(
  (a, b) => a - b
);
console.log(postcodeNumbers);
const obj = {};
postcodeNumbers.forEach(
  (postcode) =>
    (obj[postcode] = array.filter(({ p }) => p === postcode).map((x) => x.n))
);
const final = JSON.stringify(obj);
// console.log(final);
require("fs").writeFileSync(__dirname + "/suburbsForPostcode.json", final);
