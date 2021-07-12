const array = JSON.parse(
  require("fs").readFileSync(__dirname + "/suburbList.json")
);
const obj = {};
array
  .filter((x) => x.STATE_NAME === "NSW")
  .forEach((x) => (obj[x.NAME] = [x.LATITUDE, x.LONGITUDE]));

const final = JSON.stringify(obj);

// console.log(final);
require("fs").writeFileSync(__dirname + "/latLongForSuburbOnlyNSW.json", final);
