const array = require("./australian_postcodes.json");

// 4dp = ~11m precision
// See https://dpstyles.tumblr.com/post/95952859425/how-does-the-precision-of-a-lat-long-change-with-the
const PRECISION = 4;

const obj = {};
array
  .filter((x) => x.state === "NSW" && postcodeIsValid(x.postcode))
  .forEach(
    (x) =>
      (obj[x.postcode] = [
        Number(x.lat.toFixed(PRECISION)),
        Number(x.long.toFixed(PRECISION)),
      ])
  );

const final = JSON.stringify(obj);

require("fs").writeFileSync(__dirname + "/latLongForPostcodes.json", final);

function postcodeIsValid(postcode) {
  // Based on https://en.wikipedia.org/wiki/Postcodes_in_Australia#Australian_states_and_territories
  return (
    (postcode >= 2000 && postcode <= 2599) ||
    (postcode >= 2619 && postcode <= 2899) ||
    (postcode >= 2921 && postcode <= 2999)
  );
}
