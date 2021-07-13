import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    redirect: "/postcodes",
  },
  {
    path: "/postcodes",
    name: "PostcodesPage",
    component: () =>
      import(/* webpackChunkName: "listPage" */ "../views/ListPage.vue"),
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
  },
  {
    path: "/council/:councilSlug",
    name: "CouncilPage",
    component: () =>
      import(/* webpackChunkName: "dataPage" */ "../views/DataPage.vue"),
  },
  {
    path: "/all",
    redirect: "/postcodes",
  },
  {
    path: "/locations",
    redirect: "/alerts",
  },
  {
    path: "/alerts",
    name: "AlertsPage",
    component: () =>
      import(/* webpackChunkName: "alertsPage" */ "../views/AlertsPage.vue"),
  },
  {
    path: "/about",
    name: "AboutPage",
    component: () =>
      import(/* webpackChunkName: "aboutPage" */ "../views/AboutPage.vue"),
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

export default router;
