module.exports = {
  pwa: {
    workboxOptions: {
      exclude: [`_redirects`, `_headers`],
      // https://forum.vuejs.org/t/vue-cli-3-project-with-pwa-not-busting-cache-on-new-builds/50252/7
      skipWaiting: true,
      clientsClaim: true
    }
  }
};
