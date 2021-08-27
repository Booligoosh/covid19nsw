const array = require("./suburbs.json");

const final = JSON.stringify(
  array
    .filter(({ state }) => state === "NSW")
    .map(({ pcode, suburb, state, lon, lat }) => ({
      NAME: suburb
        .toLowerCase()
        .split(" ")
        .map((w) => w.substr(0, 1).toUpperCase() + w.substr(1))
        .join(" "),
      POSTCODE: Number(pcode),
      LATITUDE: Number(lat),
      LONGITUDE: Number(lon),
      STATE_NAME: state,
    }))
    .sort((a, b) => (a.NAME === b.NAME ? 0 : a.NAME < b.NAME ? -1 : 1))
);

require("fs").writeFileSync(__dirname + "/suburbListNSW.json", final);
