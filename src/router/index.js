import Vue from "vue";
import VueRouter from "vue-router";
import store from "@/store";

import ListPage from "@/views/ListPage.vue";
import AppShell from "@/views/AppShell.vue";
import AboutPage from "@/views/AboutPage.vue";
import PageNotFound from "@/views/PageNotFound.vue";

Vue.use(VueRouter);

const LIST_PAGE_DESCRIPTION_SUFFIX =
  " including new cases today, cases this week, total cases, and cases by source (local/overseas/interstate).";

const routes = [
  // Redirects
  {
    path: "/",
    redirect: "/postcodes",
  },
  // Actual routes
  {
    path: "/postcodes",
    name: "PostcodesPage",
    component: ListPage,
    meta: {
      title: "COVID Cases By Postcode",
      description:
        "See the latest COVID-19 data for your postcode/suburb" +
        LIST_PAGE_DESCRIPTION_SUFFIX,
    },
  },
  {
    path: "/postcodes/vaccinations",
    name: "PostcodesVaccinationsPage",
    component: ListPage,
    meta: {
      title: "COVID-19 vaccination rates by postcode",
      description:
        "See the latest COVID-19 vaccination rates for your postcode/suburb.",
    },
  },
  {
    path: "/postcodes/map",
    name: "Map",
    component: () => import(/* webpackChunkName: "map" */ "../views/Map.vue"),
  },
  {
    path: "/postcodes/scatter",
    name: "ScatterPage",
    component: () =>
      import(/* webpackChunkName: "scatter" */ "../views/ScatterPage.vue"),
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
    component: ListPage,
    meta: {
      title: "COVID Cases By Council/LGA",
      description:
        "See the latest COVID-19 data for your council/LGA" +
        LIST_PAGE_DESCRIPTION_SUFFIX,
    },
  },
  {
    path: "/councils/vaccinations",
    name: "CouncilsVaccinationsPage",
    component: ListPage,
    meta: {
      title: "COVID-19 vaccination rates by council/LGA",
      description:
        "See the latest COVID-19 vaccination rates for your council/LGA.",
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
    component: AboutPage,
    meta: {
      title: "About",
    },
  },
  {
    path: "/404",
    name: "AppShell",
    component: AppShell,
  },
  {
    path: "*",
    component: PageNotFound,
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
