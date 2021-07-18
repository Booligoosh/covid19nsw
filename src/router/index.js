import Vue from "vue";
import VueRouter from "vue-router";
import store from "@/store";

Vue.use(VueRouter);

const LIST_PAGE_DESCRIPTION_SUFFIX =
  " including new cases today, cases this week, total cases, and cases by source (local/overseas/interstate).";

const routes = [
  // Redirects
  {
    path: "/",
    redirect: "/postcodes",
  },
  {
    path: "/all",
    redirect: "/postcodes",
  },
  {
    path: "/locations",
    redirect: "/alerts",
  },
  // Actual routes
  {
    path: "/postcodes",
    name: "PostcodesPage",
    component: () =>
      import(/* webpackChunkName: "listPage" */ "../views/ListPage.vue"),
    meta: {
      title: "COVID-19 Cases By Postcode",
      description:
        "See the latest COVID-19 data for your postcode/suburb" +
        LIST_PAGE_DESCRIPTION_SUFFIX,
    },
  },
  {
    path: "/postcode/:postcode(2[0-9][0-9][0-9])",
    name: "PostcodePage",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "dataPage" */ "../views/DataPage.vue"),
  },
  {
    path: "/councils",
    name: "CouncilsPage",
    component: () =>
      import(/* webpackChunkName: "listPage" */ "../views/ListPage.vue"),
    meta: {
      title: "COVID-19 Cases By Council/LGA",
      description:
        "See the latest COVID-19 data for your council/LGA" +
        LIST_PAGE_DESCRIPTION_SUFFIX,
    },
  },
  {
    path: "/council/:councilSlug",
    name: "CouncilPage",
    component: () =>
      import(/* webpackChunkName: "dataPage" */ "../views/DataPage.vue"),
  },
  {
    path: "/alerts",
    name: "AlertsPage",
    component: () =>
      import(/* webpackChunkName: "alertsPage" */ "../views/AlertsPage.vue"),
    meta: {
      title: "Alerts Near Your Location",
      description:
        "See close and casual contact alerts closest to your GPS location or postcode.",
    },
  },
  {
    path: "/alerts/postcode/:postcode(2[0-9][0-9][0-9])",
    name: "PostcodeAlertsPage",
    component: () =>
      import(/* webpackChunkName: "alertsPage" */ "../views/AlertsPage.vue"),
    meta: {
      title: "Alerts near the postcode <postcode>",
      description:
        "See close and casual contact alerts near the postcode <postcode>.",
    },
  },
  {
    path: "/about",
    name: "AboutPage",
    component: () =>
      import(/* webpackChunkName: "aboutPage" */ "../views/AboutPage.vue"),
    meta: {
      title: "About",
    },
  },
  {
    path: "*",
    component: () =>
      import(
        /* webpackChunkName: "pageNotFound" */ "../views/PageNotFound.vue"
      ),
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.afterEach((to) => {
  store.commit(
    "setPageTitle",
    to.meta.title?.replace("<postcode>", to.params.postcode)
  );
  store.commit(
    "setPageDescription",
    to.meta.description?.replace("<postcode>", to.params.postcode)
  );

  document
    .querySelector("link[rel=canonical]")
    .setAttribute("href", "https://covid19nsw.ethan.link" + to.path);
});

export default router;
