import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

import parse from "csv-parse/lib/sync";
import dayjs from "dayjs";
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

import { DEFAULT_PAGE_TITLE, DEFAULT_PAGE_DESCRIPTION } from "../constants";

const store = new Vuex.Store({
  state: {
    cases: [],
    error: null,
    temporalCoverageTo: null,
    pageTitle: DEFAULT_PAGE_TITLE,
    pageDescription: DEFAULT_PAGE_DESCRIPTION
  },
  getters: {
    postcodes(state) {
      return [...new Set(state.cases.map(state => state.postcode))].filter(
        // Based on https://en.wikipedia.org/wiki/Postcodes_in_Australia#Australian_states_and_territories
        postcode =>
          (postcode >= 2000 && postcode <= 2599) ||
          (postcode >= 2619 && postcode <= 2899) ||
          (postcode >= 2921 && postcode <= 2999)
      );
    }
  },
  mutations: {
    setCases(state, cases = []) {
      state.cases = cases;
    },
    setError(state, error = "") {
      state.error = error.replace(
        "TypeError: Failed to fetch",
        "Failed to fetch data. This could be because data.nsw.gov.au isn't working, or you're not connected to the internet."
      );
    },
    setTemporalCoverageTo(state, temporalCoverageTo) {
      state.temporalCoverageTo = temporalCoverageTo;
    }
  },
  actions: {
    async loadCsvData({ commit }) {
      try {
        const url = "https://covid19nsw.booligoosh.workers.dev/v2";
        const { metadataModified, csvData } = await fetch(url).then(r =>
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
          const councilName = caseRow.lga_name19.replace(/\(.+?\)/g, "").trim();
          const councilSlug = councilName.replace(/ /g, "-").toLowerCase();
          const councilIsCityCouncil = caseRow.lga_name19.includes("(C)");
          return {
            postcode,
            date,
            councilName,
            councilSlug,
            councilIsCityCouncil
          };
        });
        console.log(cases);
        commit("setCases", cases);
        commit(
          "setTemporalCoverageTo",
          dayjs(metadataModified).subtract(1, "day")
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
