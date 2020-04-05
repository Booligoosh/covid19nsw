const array = JSON.parse(
  require("fs").readFileSync(__dirname + "/suburbList.json")
);
const final = JSON.stringify(array.filter(x => x.STATE_NAME === "NSW"));
// console.log(final);
require("fs").writeFileSync(__dirname + "/suburbListNSW.json", final);
