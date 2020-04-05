import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "home" */ "../views/Home.vue")
  },
  {
    path: "/postcode/:postcode(2[0-9][0-9][0-9])",
    name: "PostcodePage",
    component: () =>
      import(/* webpackChunkName: "postcodePage" */ "../views/PostcodePage.vue")
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
