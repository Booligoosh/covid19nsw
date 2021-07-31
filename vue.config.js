const path = require("path");
const PrerenderSPAPlugin = require("prerender-spa-plugin");

module.exports = {
  css: {
    sourceMap: true,
  },
  configureWebpack: {
    plugins: [
      new PrerenderSPAPlugin({
        staticDir: path.join(__dirname, "./dist"),
        routes: ["/app-shell", "/", "/postcodes", "/councils", "/about"],
        postProcess(renderedRoute) {
          // Ignore any redirects.
          renderedRoute.route = renderedRoute.originalRoute;
          // Remove <noscript> tag for prerendered pages as they work without JS
          renderedRoute.html = renderedRoute.html.replace(
            /<noscript>.+?<\/noscript>/g,
            ""
          );
          return renderedRoute;
        },
      }),
    ],
  },
  devServer: { port: 8081 },
};
