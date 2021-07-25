import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

import { parse } from "lil-csv";
import dayjs from "dayjs";
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

import { DEFAULT_PAGE_TITLE, DEFAULT_PAGE_DESCRIPTION } from "../constants";

const CASES_URL = "https://covid19nsw.ethan.link/data/cases.css";
const CASES_MODIFIED_URL =
  "https://covid19nsw.ethan.link/data/cases_modified.txt";
const CASE_LOCATIONS_URL =
  "https://data.nsw.gov.au/data/dataset/0a52e6c1-bc0b-48af-8b45-d791a6d8e289/resource/f3a28eed-8c2a-437b-8ac1-2dab3cf760f9/download/venue-data-2020-dec-22-v3.json";

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
    councilNames(state) {
      return [...new Set(state.cases.map((state) => state.councilName))].filter(
        (c) => !!c
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
    setPageTitle(state, pageTitle) {
      if (!pageTitle) pageTitle = DEFAULT_PAGE_TITLE;
      else pageTitle += " | COVID-19 NSW";
      state.pageTitle = pageTitle;

      document.title = pageTitle;
      document
        .querySelectorAll(".page-title-meta")
        .forEach((el) => el.setAttribute("content", pageTitle));
    },
    setPageDescription(state, pageDescription) {
      if (!pageDescription) pageDescription = DEFAULT_PAGE_DESCRIPTION;

      state.pageDescription = pageDescription;

      document
        .querySelectorAll(".page-description-meta")
        .forEach((el) => el.setAttribute("content", pageDescription));
    },
  },
  actions: {
    async loadCsvData({ commit }) {
      try {
        const fetchConfig =
          window.location.origin === "https://covid19nsw.ethan.link"
            ? {
                credentials: "include",
                mode: "no-cors",
              }
            : {}; // See https://stackoverflow.com/a/63814972

        const [csvData, metadataModified] = await Promise.all([
          fetch(CASES_URL, fetchConfig).then((r) => r.text()),
          fetch(CASES_MODIFIED_URL, fetchConfig).then((r) => r.text()),
        ]);
        console.log(csvData);
        const parsed = parse(csvData);
        console.log(parsed);
        const cases = parsed.map((caseRow) => {
          const postcode = Number(caseRow.postcode);
          const rawDate = caseRow.notification_date;
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
          dayjs(metadataModified).startOf("day").subtract(1, "day")
        );
      } catch (err) {
        console.log("CSV DATA ERROR:", err);
        commit("setError", err.toString());
      }
    },
    async getCaseLocations({ commit }) {
      try {
        const json = await fetch(CASE_LOCATIONS_URL).then((r) => r.json());

        const caseLocations = json.data.monitor.map((caseLocation) => ({
          ...caseLocation,
          // For some reason Data NSW puts everything
          // in the monitor array now, so get type
          // manually from alert text
          type: getTypeFromAlert(caseLocation.Alert),
          id: Math.random(),
        }));

        commit("setCaseLocations", caseLocations);
      } catch (err) {
        console.log("CASE LOCATIONS ERROR:", err);
        commit("setError", err.toString());
      }
    },
  },
  modules: {},
});

store.dispatch("loadCsvData");
store.dispatch("getCaseLocations");

export default store;

function getTypeFromAlert(alertText) {
  switch (alertText) {
    case "Get tested immediately and self-isolate for 14 days":
    case "Get tested immediately and self-isolate for 14 days.":
    case "Get tested immediately and self-isolate until you receive further advice from NSW Health":
      return "isolate";
    case "Get tested immediately. Self-isolate until you get a negative result.":
    case "Get tested immediately and self-isolate until you get a negative result":
    case "Get tested and immediately self-isolate until you receive a negative result":
      return "negative";
    case "Monitor for symptoms":
    case "Monitor for symptoms.":
      return "monitor";
    default:
      return "no-type";
  }
}
