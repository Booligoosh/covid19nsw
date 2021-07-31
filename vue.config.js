const path = require("path");
const PrerenderSPAPlugin = require("prerender-spa-plugin");

module.exports = {
  pwa: {
    name: "COVID-19 NSW",
    manifestOptions: {
      short_name: "COVID-19 NSW",
      start_url: "/?utm_source=web_app_manifest&utm_medium=start_url",
      background_color: "#FFFFFF",
    },
    themeColor: "#FFFFFF",
    msTileColor: "#FFFFFF",
    iconPaths: {
      favicon32: null,
      favicon16: null,
      appleTouchIcon: "img/icons/apple-touch-icon-180x180.png",
      maskIcon: null,
      msTileImage: null,
    },
    workboxOptions: {
      exclude: [
        "_redirects",
        "_headers",
        /.map$/,
        "sitemap.xml",
        "opensearch.xml",
        "robots.txt",
        /\/data\/.+/,
      ],
      // https://forum.vuejs.org/t/vue-cli-3-project-with-pwa-not-busting-cache-on-new-builds/50252/7
      skipWaiting: true,
      clientsClaim: true,
    },
  },
  css: {
    sourceMap: true,
  },
  configureWebpack: {
    plugins: [
      new PrerenderSPAPlugin({
        staticDir: path.join(__dirname, "./dist"),
        routes: ["/", "/postcodes", "/councils", "/about"],
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
