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

          renderedRoute.html = renderedRoute.html
            // Remove <noscript> tag for prerendered pages as they work without JS
            .replace(/<noscript>.+?<\/noscript>/g, "")
            // Remove gtag stuff so it doesn't get added twice
            .replace(
              `<link href="https://www.googletagmanager.com" rel="preconnect"><script async="" src="https://www.googletagmanager.com/gtag/js?id=UA-103555680-12&amp;l=dataLayer"></script>`,
              ""
            )
            // Remove empty class attributes
            .replace(/ class=""/g, "");

          return renderedRoute;
        },
      }),
    ],
  },
  chainWebpack: (config) => {
    // See https://github.com/DustinJackson/html-webpack-inline-source-plugin/issues/50#issuecomment-421896798
    if (config.plugins.has("preload"))
      config.plugin("preload").tap((args) => {
        args[0].fileBlacklist.push(/app\..+?\.css$/);
        return args;
      });

    config
      .plugin("inline-source")
      .use(require("html-webpack-inline-source-plugin"));

    config.plugin("html").tap((args) => {
      args[0].inlineSource = "app\\..+?\\.css$";
      return args;
    });

    config.module
      .rule("vue")
      .use("vue-svg-inline-loader")
      .loader("vue-svg-inline-loader");
  },
  devServer: { port: 8081 },
};
