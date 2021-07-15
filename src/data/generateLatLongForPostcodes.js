const array = require("./australian_postcodes.json");

const obj = {};
array
  .filter((x) => x.state === "NSW")
  .forEach((x) => (obj[x.postcode] = [x.lat, x.long]));

const final = JSON.stringify(obj);

require("fs").writeFileSync(__dirname + "/latLongForPostcodes.json", final);
