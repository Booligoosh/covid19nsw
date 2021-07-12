import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

import { parse } from "lil-csv";
import dayjs from "dayjs";
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

import { DEFAULT_PAGE_TITLE, DEFAULT_PAGE_DESCRIPTION } from "../constants";

const store = new Vuex.Store({
  state: {
    cases: [],
    error: null,
    temporalCoverageTo: null,
    caseLocations: null,
    pageTitle: DEFAULT_PAGE_TITLE,
    pageDescription: DEFAULT_PAGE_DESCRIPTION,
  },
  getters: {
    postcodes(state) {
      return [...new Set(state.cases.map((state) => state.postcode))].filter(
        // Based on https://en.wikipedia.org/wiki/Postcodes_in_Australia#Australian_states_and_territories
        (postcode) =>
          (postcode >= 2000 && postcode <= 2599) ||
          (postcode >= 2619 && postcode <= 2899) ||
          (postcode >= 2921 && postcode <= 2999)
      );
    },
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
    },
    setCaseLocations(state, caseLocations = null) {
      state.caseLocations = caseLocations;
    },
  },
  actions: {
    async loadCsvData({ commit }) {
      try {
        const { metadataModified, csvData, caseLocations } = await fetch(
          "https://covid19nsw.ethan.link/worker"
        ).then((r) => r.json());
        console.log(csvData);
        const parsed = parse(csvData);
        console.log(parsed);
        const cases = parsed.map((caseRow) => {
          const postcode = Number(caseRow.postcode);
          // const date = new Date(caseRow.notification_date);
          // date.setHours(0);
          // date.setMinutes(0);
          // date.setSeconds(0);
          const rawDate = caseRow.notification_date;
          const date = dayjs(rawDate);
          const councilName = caseRow.lga_name19.replace(/\(.+?\)/g, "").trim();
          const councilSlug = councilName.replace(/ /g, "-").toLowerCase();
          const councilIsCityCouncil = caseRow.lga_name19.includes("(C)");
          const source = caseRow.likely_source_of_infection.startsWith(
            "Locally acquired"
          )
            ? "Local"
            : caseRow.likely_source_of_infection;
          return {
            postcode,
            rawDate,
            date,
            councilName,
            councilSlug,
            councilIsCityCouncil,
            source,
          };
        });
        console.log(cases);
        commit("setCases", cases);
        commit(
          "setTemporalCoverageTo",
          dayjs(metadataModified)
            .startOf("day")
            .subtract(1, "day")
        );
        commit("setCaseLocations", caseLocations);
      } catch (err) {
        commit("setError", err.toString());
      }
    },
  },
  modules: {},
});

store.dispatch("loadCsvData");

export default store;
