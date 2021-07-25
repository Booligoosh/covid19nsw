let sitemap = "";
sitemap += '<?xml version="1.0" encoding="UTF-8"?>';
sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
sitemap +=
  "<url><loc>https://covid19nsw.ethan.link/postcodes</loc><changefreq>daily</changefreq></url>";
sitemap +=
  "<url><loc>https://covid19nsw.ethan.link/councils</loc><changefreq>daily</changefreq></url>";
sitemap += "<url><loc>https://covid19nsw.ethan.link/alerts</loc></url>";
sitemap += "<url><loc>https://covid19nsw.ethan.link/about</loc></url>";

const postcodes = require("./src/data/built/postcodes.json");
for (const postcode of postcodes) {
  sitemap += `<url><loc>https://covid19nsw.ethan.link/postcode/${postcode}</loc><changefreq>daily</changefreq></url>`;
  sitemap += `<url><loc>https://covid19nsw.ethan.link/alerts/postcode/${postcode}</loc><changefreq>daily</changefreq></url>`;
}

const councilNames = require("./src/data/built/councilNames.json");
for (const councilName of councilNames) {
  const councilSlug = councilName.replace(/ /g, "-").toLowerCase();
  sitemap += `<url><loc>https://covid19nsw.ethan.link/council/${councilSlug}</loc><changefreq>daily</changefreq></url>`;
}

sitemap += "</urlset>";

require("fs").writeFileSync("./public/sitemap.xml", sitemap);
