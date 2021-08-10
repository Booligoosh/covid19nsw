const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const Prerenderer = require("@prerenderer/prerenderer");
const JSDOMRenderer = require("@prerenderer/renderer-jsdom");

const routes = ["/app-shell", "/", "/postcodes", "/councils", "/about"];

const staticDir = path.join(__dirname, "dist");

const prerenderer = new Prerenderer({
  // Required - The path to the app to prerender. Should have an index.html and any other needed assets.
  staticDir,
  // The plugin that actually renders the page.
  renderer: new JSDOMRenderer({
    renderAfterDocumentEvent: "x-render-trigger",
  }),
});

// Initialize is separate from the constructor for flexibility of integration with build systems.
prerenderer
  .initialize()
  .then(() => {
    // List of routes to render.
    return prerenderer.renderRoutes(routes);
  })
  .then((renderedRoutes) => {
    renderedRoutes.forEach(async (renderedRoute) => {
      const { route, html } = postProcess(renderedRoute);

      const outputPath = path.join(staticDir, route, "index.html");

      console.log(outputPath);
      // console.log(html);

      await mkdirp(path.dirname(outputPath));
      fs.writeFile(outputPath, html.trim(), () => {});
    });

    // Shut down the file server and renderer.
    prerenderer.destroy();
  })
  .catch((err) => {
    // Shut down the server and renderer.
    prerenderer.destroy();
    // Handle errors.
    console.error(err);
  });

function postProcess(renderedRoute) {
  // Ignore any redirects.
  renderedRoute.route = renderedRoute.originalRoute;

  renderedRoute.html = renderedRoute.html
    // Remove <noscript> tag for prerendered pages as they work without JS
    .replace(/<noscript>.+?<\/noscript>/g, "")
    // Remove gtag stuff so it doesn't get added twice
    .replace(
      `<link href="https://www.googletagmanager.com" rel="preconnect"><script src="https://www.googletagmanager.com/gtag/js?id=UA-103555680-12&amp;l=dataLayer"></script>`,
      ""
    )
    // Remove empty class attributes
    .replace(/ class=""/g, "");

  return renderedRoute;
}
