const array = JSON.parse(
  require("fs").readFileSync(__dirname + "/suburbListNamePostcodeOnlyNSW.json")
);
const suburbNames = [...new Set(array.map(x => x.n))].sort();
console.log(suburbNames);
const obj = {};
suburbNames.forEach(
  suburbName =>
    (obj[suburbName] = array.filter(({ n }) => n === suburbName).map(x => x.p))
);
const final = JSON.stringify(obj);
// console.log(final);
require("fs").writeFileSync(__dirname + "/postcodesForSuburb.json", final);
