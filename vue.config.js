module.exports = {
  pwa: {
    name: "COVID-19 NSW",
    manifestOptions: {
      short_name: "COVID-19 Data",
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
};
