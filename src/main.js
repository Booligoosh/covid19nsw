import Vue from "vue";
import App from "./App.vue";
import store from "./store";
import router from "./router";

Vue.config.productionTip = false;

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
  mounted() {
    this.$nextTick(() => document.dispatchEvent(new Event("x-render-trigger")));
  },
}).$mount("#app");

// Unregister old service workers
navigator.serviceWorker
  ?.getRegistrations()
  ?.then((registrations) =>
    registrations?.forEach((registration) => registration.unregister())
  );
