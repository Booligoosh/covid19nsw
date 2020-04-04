import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

import parse from "csv-parse/lib/sync";
import dayjs from "dayjs";
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const store = new Vuex.Store({
  state: {
    cases: [],
    error: null,
    temporalCoverageTo: null,
    pageTitle: "",
    pageDescription: ""
  },
  getters: {
    postcodes(state) {
      return [...new Set(state.cases.map(state => state.postcode))].sort();
    }
  },
  mutations: {
    setCases(state, cases = []) {
      state.cases = cases;
    },
    setError(state, error = "") {
      state.error = error;
    },
    setTemporalCoverageTo(state, temporalCoverageTo) {
      state.temporalCoverageTo = temporalCoverageTo;
    }
  },
  actions: {
    async loadCsvData({ commit }) {
      try {
        const url = "https://covid19nsw.booligoosh.workers.dev/v2";
        const { temporalCoverageTo, csvData } = await fetch(url).then(r =>
          r.json()
        );
        console.log(csvData);
        const parsed = parse(csvData, {
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
        commit(
          "setTemporalCoverageTo",
          dayjs(temporalCoverageTo, "DD MMMM YYYY")
        );
      } catch (err) {
        commit("setError", err.toString());
      }
    }
  },
  modules: {}
});

store.dispatch("loadCsvData");

export default store;
