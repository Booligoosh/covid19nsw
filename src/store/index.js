import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

import {
  DEFAULT_PAGE_TITLE,
  DEFAULT_PAGE_DESCRIPTION,
  SOURCE_TIMEZONE,
} from "../constants";
import metadataModified from "@/data/built/metadataModified.json";
import {
  postcodeVaccinationsAsOf,
  councilVaccinationsAsOf,
} from "@/data/built/vaccinationsAsOf.json";

const CASE_LOCATIONS_URL =
  "https://data.nsw.gov.au/data/dataset/0a52e6c1-bc0b-48af-8b45-d791a6d8e289/resource/f3a28eed-8c2a-437b-8ac1-2dab3cf760f9/download/venue-data-2020-dec-22-v3.json";

// Store date of last visit so I can display update messages in future
localStorage.lastVisit = new Date().toISOString();

const store = new Vuex.Store({
  state: {
    error: null,
    metadataModified: dayjs(metadataModified).tz(SOURCE_TIMEZONE),
    temporalCoverageTo: dayjs(metadataModified)
      .tz(SOURCE_TIMEZONE)
      .startOf("day")
      .subtract(1, "day"),
    postcodeVaccinationsAsOf: dayjs(postcodeVaccinationsAsOf).tz(
      SOURCE_TIMEZONE
    ),
    councilVaccinationsAsOf: dayjs(councilVaccinationsAsOf).tz(SOURCE_TIMEZONE),
    caseLocations: null,
    pageTitle: DEFAULT_PAGE_TITLE,
    pageDescription: DEFAULT_PAGE_DESCRIPTION,
    navigationStackSize: 0,
    // Chart options stored globally so they persist between pages
    chartNumDays: calculateDefaultChartNumDays(),
    newCasesMode: true,
    sourceMode: false,
    // Table options stored globally so they persist between pages
    listPageCasesSort: "newCasesThisWeek",
    listPageVaccinationsSort: "dose2",
    listPagePerPopMode: false,
  },
  getters: {
    canGoBack(state) {
      // 0 is before the first route has been loaded
      // 1 is after the first rote has been loaded
      // >1 indicates more than 1 route has been loaded,
      // therefore going back is safe and will stay in
      // the domain.
      return state.navigationStackSize > 1;
    },
  },
  mutations: {
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
    changeNavigationStackSize(state, change) {
      state.navigationStackSize += change;
      console.log("navigationStackSize:", state.navigationStackSize);
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
    setListPageCasesSort(state, key) {
      state.listPageCasesSort = key;
    },
    setListPageVaccinationsSort(state, key) {
      state.listPageVaccinationsSort = key;
    },
  },
  actions: {
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

export default store;

function getTypeFromAlert(alertText) {
  switch (alertText) {
    case "Get tested immediately and self-isolate for 14 days":
    case "Get tested immediately and self-isolate for 14 days.":
    case "Get tested immediately and self-isolate until you receive further advice from NSW Health":
    case "Get tested immediately and self-isolate until you receive further advice.":
      return "isolate";
    case "Get tested immediately. Self-isolate until you get a negative result.":
    case "Get tested immediately and self-isolate until you get a negative result":
    case "Get tested and immediately self-isolate until you receive a negative result":
      return "negative";
    case "Monitor for symptoms":
    case "Monitor for symptoms.":
      return "monitor";
    default:
      console.warn("COULD NOT DETERMINE TYPE:", alertText);
      return "no-type";
  }
}

function calculateDefaultChartNumDays() {
  if (window.innerWidth < 587) return 14;
  return 28;
}
