const postcodeRanges = [
  // From https://en.wikipedia.org/wiki/Postcodes_in_Australia#Australian_states_and_territories
  [2000, 2599],
  [2619, 2899],
  [2921, 2999],
];

let sitemap = "";
sitemap += '<?xml version="1.0" encoding="UTF-8"?>';
sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
sitemap += "<url><loc>https://covid19nsw.ethan.link/</loc></url>";

for (const postcodeRange of postcodeRanges) {
  for (
    let postcode = postcodeRange[0];
    postcode <= postcodeRange[1];
    postcode++
  ) {
    sitemap += `<url><loc>https://covid19nsw.ethan.link/postcode/${postcode}</loc><changefreq>daily</changefreq></url>`;
  }
}

sitemap += "</urlset>";

require("fs").writeFileSync("./public/sitemap.xml", sitemap);
