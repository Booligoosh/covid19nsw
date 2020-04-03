import Vue from "vue";
import App from "./App.vue";
import store from "./store";
import "./registerServiceWorker";
import router from "./router";

Vue.config.productionTip = false;

import Chart from "vue2-frappe";
Vue.use(Chart);

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount("#app");
