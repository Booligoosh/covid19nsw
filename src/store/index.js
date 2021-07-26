import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

import dayjs from "dayjs";
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

import { DEFAULT_PAGE_TITLE, DEFAULT_PAGE_DESCRIPTION } from "../constants";
import councilNames from "@/data/built/councilNames.json";

const CASES_URL = "/data/cases.json";
const CASE_LOCATIONS_URL =
  "https://data.nsw.gov.au/data/dataset/0a52e6c1-bc0b-48af-8b45-d791a6d8e289/resource/f3a28eed-8c2a-437b-8ac1-2dab3cf760f9/download/venue-data-2020-dec-22-v3.json";

// Store date of last visit so I can display update messages in future
localStorage.lastVisit = new Date().toISOString();

const store = new Vuex.Store({
  state: {
    cases: [],
    error: null,
    temporalCoverageTo: dayjs(
      document
        .querySelector("meta[name=cases_modified]")
        .getAttribute("content")
    )
      .startOf("day")
      .subtract(1, "day"),
    caseLocations: null,
    pageTitle: DEFAULT_PAGE_TITLE,
    pageDescription: DEFAULT_PAGE_DESCRIPTION,
    // Chart options stored globally so they persist between pages
    chartNumDays: calculateDefaultChartNumDays(),
    newCasesMode: true,
    sourceMode: false,
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
    setChartNumDays(state, chartNumDays) {
      state.chartNumDays = chartNumDays;
    },
    setNewCasesMode(state, newCasesMode) {
      state.newCasesMode = newCasesMode;
    },
    setSourceMode(state, sourceMode) {
      state.sourceMode = sourceMode;
    },
  },
  actions: {
    async loadCsvData({ commit }) {
      try {
        // See https://stackoverflow.com/a/63814972
        const fetchConfig = {
          credentials: "include",
          mode: "no-cors",
        };
        console.time("Fetch JSON");
        const casesRes = await fetch(CASES_URL, fetchConfig);
        console.timeEnd("Fetch JSON");
        console.time("Parse JSON");
        // Cases with minified properties
        const casesMin = await casesRes.json();
        console.timeEnd("Parse JSON");
        console.time("Transform parsed JSON");
        const cases = casesMin.map(([p, d, s, x, y]) => ({
          postcode: p,
          rawDate: d,
          source: ["Local", "Interstate", "Overseas"][s],
          councilName: councilNames[x],
          councilSlug: councilNames[x]?.replace(/ /g, "-").toLowerCase(),
          councilIsCityCouncil: !!y,
        }));
        console.timeEnd("Transform parsed JSON");
        commit("setCases", cases);
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

function calculateDefaultChartNumDays() {
  if (window.innerWidth < 376) return 7;
  if (window.innerWidth < 587) return 14;
  if (window.innerWidth < 815) return 21;
  return 28;
}
