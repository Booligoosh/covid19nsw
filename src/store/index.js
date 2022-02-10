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
  ALL_TIME_FLAG,
} from "../constants";
import {
  metadataModified,
  temporalCoverageTo,
} from "@/data/built/casesAsOf.json";
import {
  postcodeVaccinationsAsOf,
  councilVaccinationsAsOf,
} from "@/data/built/vaccinationsAsOf.json";

// Determine whether to display source checkbox with deprecation message
if (localStorage.lastVisit <= "2021-11-22T03:43:57.446Z")
  localStorage.showSourceCheckbox = true;
// Store date of last visit so I can display update messages in future
localStorage.lastVisit = new Date().toISOString();

const store = new Vuex.Store({
  state: {
    error: null,
    metadataModified: dayjs(metadataModified).tz(SOURCE_TIMEZONE),
    temporalCoverageTo: dayjs(temporalCoverageTo).tz(SOURCE_TIMEZONE),
    postcodeVaccinationsAsOf: dayjs(postcodeVaccinationsAsOf).tz(
      SOURCE_TIMEZONE
    ),
    councilVaccinationsAsOf: dayjs(councilVaccinationsAsOf).tz(SOURCE_TIMEZONE),
    caseLocations: null,
    pageTitle: DEFAULT_PAGE_TITLE,
    pageDescription: DEFAULT_PAGE_DESCRIPTION,
    navigationStackSize: 0,
    showSourceCheckbox: localStorage.showSourceCheckbox,
    // Chart options stored globally so they persist between pages
    casesChartNumDays: calculateDefaultChartNumDays(),
    vaccineChartNumDays: ALL_TIME_FLAG,
    newCasesMode: true,
    chartVaccineMode: false,
    // Table options stored globally so they persist between pages
    listPageCasesSort: "newCasesThisWeek",
    listPageVaccinationsSort: "dose2",
    listPagePerPopMode: false,
    isEmbed: false,
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
    setChartNumDays(state, [chartNumDays, forVaccineMode]) {
      if (forVaccineMode) state.vaccineChartNumDays = chartNumDays;
      else state.casesChartNumDays = chartNumDays;
    },
    setNewCasesMode(state, newCasesMode) {
      state.newCasesMode = newCasesMode;
    },
    setChartVaccineMode(state, chartVaccineMode) {
      state.chartVaccineMode = chartVaccineMode;
    },
    setListPageCasesSort(state, key) {
      state.listPageCasesSort = key;
    },
    setListPageVaccinationsSort(state, key) {
      state.listPageVaccinationsSort = key;
    },
    hideSourceCheckbox(state) {
      state.showSourceCheckbox = false;
      delete localStorage.showSourceCheckbox;
    },
    setIsEmbed(state, isEmbed) {
      state.isEmbed = isEmbed;
    },
  },
  actions: {},
  modules: {},
});

export default store;

function calculateDefaultChartNumDays() {
  if (window.innerWidth < 587) return 14;
  return 28;
}
