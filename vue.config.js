module.exports = {
  pwa: {
    name: "COVID-19 data for New South Wales",
    manifestOptions: {
      short_name: "COVID-19 Data"
    },
    workboxOptions: {
      exclude: ["_redirects", "_headers", /.map$/],
      // https://forum.vuejs.org/t/vue-cli-3-project-with-pwa-not-busting-cache-on-new-builds/50252/7
      skipWaiting: true,
      clientsClaim: true
    }
  },
  css: {
    sourceMap: true
  }
};
