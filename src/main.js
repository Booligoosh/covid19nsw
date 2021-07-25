import Vue from "vue";
import App from "./App.vue";
import store from "./store";
import "./registerServiceWorker";
import router from "./router";

Vue.config.productionTip = false;

import Chart from "vue2-frappe";
Vue.use(Chart);

import VueGtag from "vue-gtag";
Vue.use(
  VueGtag,
  {
    config: { id: "UA-103555680-12" },
  },
  router
);

new Vue({
  store,
  router,
  render: (h) => h(App),
}).$mount("#app");
