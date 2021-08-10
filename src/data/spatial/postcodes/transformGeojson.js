const geojson = require("./geojson.json");

console.log("Postcodes count before transformation:", geojson.features.length);

geojson.features = geojson.features
  .map((feature) => {
    const postcode = Number(feature.properties.POA_CODE16);
    feature.properties = { p: postcode };
    if (postcodeIsValid(postcode)) return feature;
    else return null;
  })
  .filter((x) => !!x);

console.log("Postcodes count after transformation:", geojson.features.length);

require("fs").writeFileSync("./geojson.json", JSON.stringify(geojson));

function postcodeIsValid(postcode) {
  // Based on https://en.wikipedia.org/wiki/Postcodes_in_Australia#Australian_states_and_territories
  return (
    (postcode >= 2000 && postcode <= 2599) ||
    (postcode >= 2619 && postcode <= 2899) ||
    (postcode >= 2921 && postcode <= 2999)
  );
}
