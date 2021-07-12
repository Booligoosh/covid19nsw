const array = JSON.parse(
  require("fs").readFileSync(__dirname + "/suburbList.json")
);
const final = JSON.stringify(
  array
    .filter((x) => x.STATE_NAME === "NSW")
    .map((x) => ({
      // Use n and p instead of name and postcode to reduce file size
      n: x.NAME,
      p: x.POSTCODE,
    }))
);
// console.log(final);
require("fs").writeFileSync(
  __dirname + "/suburbListNamePostcodeOnlyNSW.json",
  final
);
