const array = JSON.parse(
  require("fs").readFileSync(__dirname + "/suburbListNSW.json")
);
const obj = {};
array.forEach((x) => (obj[x.NAME] = [x.LATITUDE, x.LONGITUDE]));

const final = JSON.stringify(obj);

require("fs").writeFileSync(__dirname + "/latLongForSuburbs.json", final);
