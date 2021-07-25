const cases_modified = require("fs")
  .readFileSync("./public/data/cases_modified.txt")
  .toString();

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
  // https://cli.vuejs.org/guide/webpack.html#modifying-options-of-a-plugin
  chainWebpack: (config) => {
    config.plugin("html").tap((args) => {
      args[0].meta = { cases_modified };
      return args;
    });
  },
  css: {
    sourceMap: true,
  },
  devServer: { port: 8081 },
};
