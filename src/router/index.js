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
    redirect: "/cases/by-postcode",
  },
  {
    path: "/postcodes",
    redirect: "/cases/by-postcode",
  },
  {
    path: "/postcodes/vaccinations",
    redirect: "/vaccines/by-postcode",
  },
  {
    path: "/councils",
    redirect: "/cases/by-council",
  },
  {
    path: "/councils/vaccinations",
    redirect: "/vaccines/by-council",
  },
  // Actual routes
  {
    path: "/cases/by-postcode",
    name: "PostcodesPage",
    component: ListPage,
    meta: {
      title: "COVID Cases By Postcode",
      description:
        "See the latest COVID-19 data for your postcode/suburb" +
        LIST_PAGE_DESCRIPTION_SUFFIX,
      showSearch: true,
    },
  },
  {
    path: "/vaccines/by-postcode",
    name: "PostcodesVaccinationsPage",
    component: ListPage,
    meta: {
      title: "COVID-19 Vaccination Rates By Postcode",
      description:
        "See the latest COVID-19 vaccination rates for your postcode/suburb.",
      showSearch: true,
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
    meta: { showSearch: true },
  },
  {
    path: "/cases/by-council",
    name: "CouncilsPage",
    component: ListPage,
    meta: {
      title: "COVID Cases By Council/LGA",
      description:
        "See the latest COVID-19 data for your council/LGA" +
        LIST_PAGE_DESCRIPTION_SUFFIX,
      showSearch: true,
    },
  },
  {
    path: "/vaccines/by-council",
    name: "CouncilsVaccinationsPage",
    component: ListPage,
    meta: {
      title: "COVID-19 Vaccination Rates By Council/LGA",
      description:
        "See the latest COVID-19 vaccination rates for your council/LGA.",
      showSearch: true,
    },
  },
  {
    path: "/council/:councilSlug",
    name: "CouncilPage",
    component: () =>
      import(/* webpackChunkName: "dataPage" */ "../views/DataPage.vue"),
    meta: { showSearch: true },
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
