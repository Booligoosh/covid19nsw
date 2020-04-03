import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

import parse from "csv-parse/lib/sync";
import dayjs from "dayjs";

const store = new Vuex.Store({
  state: {
    cases: []
  },
  getters: {
    postcodes(state) {
      return [...new Set(state.cases.map(state => state.postcode))].sort();
    }
  },
  mutations: {
    setCases(state, cases = []) {
      state.cases = cases;
    }
  },
  actions: {
    async loadCsvData({ commit }) {
      const url =
        process.env.NODE_ENV === "production"
          ? "https://covid19nsw.booligoosh.workers.dev/"
          : "https://cors-anywhere.herokuapp.com/https://data.nsw.gov.au/data/dataset/aefcde60-3b0c-4bc0-9af1-6fe652944ec2/resource/21304414-1ff1-4243-a5d2-f52778048b29/download/covid-19-cases-by-notification-date-and-postcode-local-health-district-and-local-government-area.csv";
      const text = await fetch(url).then(r => r.text());
      console.log(text);
      const parsed = parse(text, {
        columns: true
      });
      console.log(parsed);
      const cases = parsed.map(caseRow => {
        const postcode = Number(caseRow.postcode);
        // const date = new Date(caseRow.notification_date);
        // date.setHours(0);
        // date.setMinutes(0);
        // date.setSeconds(0);
        const date = dayjs(caseRow.notification_date);
        return { postcode, date };
      });
      console.log(cases);
      commit("setCases", cases);
    }
  },
  modules: {}
});

store.dispatch("loadCsvData");

export default store;
