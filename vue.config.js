module.exports = {
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
