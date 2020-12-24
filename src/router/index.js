import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home
  },
  {
    path: "/postcode/:postcode(2[0-9][0-9][0-9])",
    name: "PostcodePage",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "dataPage" */ "../views/DataPage.vue")
  },
  {
    path: "/council/:councilSlug",
    name: "CouncilPage",
    component: () =>
      import(/* webpackChunkName: "dataPage" */ "../views/DataPage.vue")
  },
  {
    path: "/all",
    name: "AllPostcodes",
    component: () =>
      import(/* webpackChunkName: "allPostcodes" */ "../views/AllPostcodes.vue")
  },
  {
    path: "/locations",
    name: "CaseLocations",
    component: () =>
      import(/* webpackChunkName: "caseLocations" */ "../views/CaseLocations.vue")
  },
  {
    path: "*",
    component: () =>
      import(/* webpackChunkName: "pageNotFound" */ "../views/PageNotFound.vue")
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
