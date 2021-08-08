<!-- This file resolves the /postcode and /council routes -->

<template>
  <div class="page-error" v-if="$store.state.error">
    ⚠ {{ $store.state.error }}
  </div>
  <div class="page-loading" v-else-if="$store.state.cases.length === 0">
    Loading&hellip;
  </div>
  <PageNotFound
    v-else-if="isCouncil && allCases.length === 0"
    :isOnCouncilPage="true"
  />
  <div class="data-page" v-else>
    <RenderDetector @created="mainContentRendered" />
    <div class="top-grid">
      <h1 v-if="isCouncil">
        <span><span class="not-bold">Cases in</span> {{ councilName }}</span>
      </h1>
      <h1 v-else>
        <span
          ><span class="not-bold">Cases in the postcode</span>
          {{ postcodeNumber }}</span
        >
        <div class="suburbs-text">
          {{ suburbsText }}
        </div>
      </h1>
      <div class="stat-numbers">
        <div class="stat-numbers-item">
          <div class="stat-numbers-item-num">{{ caseCounts.today }}</div>
          <div class="stat-numbers-item-label">today</div>
        </div>
        <div class="stat-numbers-item">
          <div class="stat-numbers-item-num">{{ caseCounts.thisWeek }}</div>
          <div class="stat-numbers-item-label">this week</div>
        </div>
        <div class="stat-numbers-item">
          <div class="stat-numbers-item-num">{{ caseCounts.thisOutbreak }}</div>
          <div class="stat-numbers-item-label">
            since
            <span style="white-space: nowrap">
              {{ OUTBREAK_START_DATE_FORMATTED }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div id="chart" ref="chart" class="main-chart"></div>
    <div class="chart-config">
      <div class="chart-config-row">
        <span class="chart-config-row-name">Graph type: &nbsp;</span>
        <button
          @click="$store.commit('setNewCasesMode', false)"
          :class="{ active: !newCasesMode }"
        >
          Total cases
        </button>
        <button
          @click="$store.commit('setNewCasesMode', true)"
          :class="{ active: newCasesMode }"
        >
          New cases
        </button>
        <label>
          <input type="checkbox" v-model="$store.state.sourceMode" />
          By source
        </label>
      </div>
      <div class="chart-config-row">
        <span class="chart-config-row-name">Graph time period: &nbsp;</span>
        <button
          @click="$store.commit('setChartNumDays', 14)"
          :class="{ active: chartNumDays === 14 }"
        >
          2<span class="non-compact">&nbsp;</span>w<span class="non-compact"
            >eeks</span
          >
        </button>
        <button
          @click="$store.commit('setChartNumDays', 28)"
          :class="{ active: chartNumDays === 28 }"
        >
          4<span class="non-compact">&nbsp;</span>w<span class="non-compact"
            >eeks</span
          >
        </button>
        <button
          @click="$store.commit('setChartNumDays', outbreakDays)"
          :class="{ active: outbreakMode }"
        >
          This wave
        </button>
        <button
          @click="$store.commit('setChartNumDays', allTimeDays)"
          :class="{ active: allTimeMode }"
        >
          All-time
        </button>
      </div>
    </div>
    <router-link
      v-if="!isCouncil"
      class="alerts-link"
      :to="{
        name: 'PostcodeAlertsPage',
        params: { postcode: postcodeNumber },
      }"
    >
      See nearby alerts →
    </router-link>
    <!-- <button class="add-to-home-screen">Add to home screen</button> -->
    <!-- <pre style="text-align: left">{{
      JSON.stringify(allCases, null, 2)
    }}</pre> -->
    <!-- <pre>{{ JSON.stringify(chartData, null, 2) }}</pre> -->
  </div>
</template>

<script>
import PageNotFound from "@/views/PageNotFound.vue";
import suburbsForPostcode from "@/data/suburbsForPostcode.json";
import {
  ALL_TIME_START_DATE,
  OUTBREAK_START_DATE,
  OUTBREAK_START_DATE_FORMATTED,
} from "@/constants.js";

import { Chart } from "frappe-charts";
import RenderDetector from "../components/RenderDetector.vue";

const AVG_PERIOD = 5;

export default {
  name: "DataPage",
  components: {
    PageNotFound,
    RenderDetector,
  },
  data() {
    return {
      OUTBREAK_START_DATE_FORMATTED,
    };
  },
  computed: {
    chartNumDays() {
      return this.$store.state.chartNumDays;
    },
    newCasesMode() {
      return this.$store.state.newCasesMode;
    },
    sourceMode() {
      return this.$store.state.sourceMode;
    },
    isCouncil() {
      return this.$route.name === "CouncilPage";
    },
    postcodeNumber() {
      return Number(this.$route.params.postcode);
    },
    avgPeriod() {
      return this.newCasesMode ? AVG_PERIOD : 1;
    },
    allTimeDays() {
      return (
        this.$store.state.temporalCoverageTo.diff(ALL_TIME_START_DATE, "day") +
        1
      );
    },
    outbreakDays() {
      return (
        this.$store.state.temporalCoverageTo.diff(OUTBREAK_START_DATE, "day") +
        1
      );
    },
    suburbsText() {
      return suburbsForPostcode[this.postcodeNumber] || "(Suburbs unknown)";
    },
    councilName() {
      const oneCase = this.allCases[0] || {};
      return `${oneCase.councilName}${
        oneCase.councilIsCityCouncil ? " City" : ""
      } Council`;
    },
    allCases() {
      if (this.isCouncil) {
        return this.$store.state.cases.filter(
          ({ councilSlug }) => councilSlug === this.$route.params.councilSlug
        );
      } else {
        return this.$store.state.cases.filter(
          ({ postcode }) => postcode === this.postcodeNumber
        );
      }
    },
    totalCases() {
      return this.allCases.length;
    },
    caseCounts() {
      if (!this.$store.state.temporalCoverageTo)
        return { today: 0, thisWeek: 0, thisOutbreak: 0 };
      // Both in 1 function to halve the number of iterations.
      // See the individual getters based on its outputs below.
      const todayDate =
        this.$store.state.temporalCoverageTo.format("YYYY-MM-DD");
      const oneWeekAgo = this.$store.state.temporalCoverageTo
        .subtract(7, "days")
        .format("YYYY-MM-DD");

      let today = 0;
      let thisWeek = 0;
      let thisOutbreak = 0;

      this.allCases.forEach((caseObj) => {
        if (caseObj.rawDate === todayDate) {
          today++;
          thisWeek++;
          thisOutbreak++;
        } else if (caseObj.rawDate > oneWeekAgo) {
          thisWeek++;
          thisOutbreak++;
        } else if (caseObj.rawDate > OUTBREAK_START_DATE) {
          thisOutbreak++;
        }
      });

      return { today, thisWeek, thisOutbreak };
    },
    lastXDays() {
      if (!this.$store.state.temporalCoverageTo) return [];
      // Add avgPeriod-1 days before the period
      return Array(this.chartNumDays + this.avgPeriod - 1)
        .fill(0)
        .map((_, i) => this.$store.state.temporalCoverageTo.subtract(i, "days"))
        .reverse();
    },
    rawDates() {
      return this.lastXDays.map((date) => date.format("YYYY-MM-DD"));
    },
    lastUpdatedString() {
      return this.$store.state.temporalCoverageTo.format("D MMMM");
    },
    allTimeMode() {
      return this.chartNumDays === this.allTimeDays;
    },
    outbreakMode() {
      return this.chartNumDays === this.outbreakDays;
    },
    chartLabels() {
      const format = this.allTimeMode ? "D MMM YYYY" : "D MMM";
      return (
        this.lastXDays
          // Remove the first avgPeriod-1 days
          .slice(this.avgPeriod - 1, this.chartNumDays + this.avgPeriod - 1)
          .map((date) => date.format(format))
      );
    },
    normalChartDatasets() {
      console.time("Calculate normalChartDatasets");

      console.log(
        this.chartNumDays,
        this.totalCases,
        "Requires",
        this.chartNumDays * this.totalCases,
        "operations"
      );

      const cumulative = !this.newCasesMode;
      // Add avgPeriod-1 days BEFORE the period
      const newCaseValues = new Array(
        this.chartNumDays + this.avgPeriod - 1
      ).fill(0);
      // Add avgPeriod-1 days AFTER the period
      const prevPeriodTotals = new Array(
        this.chartNumDays + this.avgPeriod - 1
      ).fill(0);
      const caseRawDates = this.allCases.map((c) => c.rawDate);

      // Interate through each date
      this.rawDates.forEach((date, i) => {
        let casesValue = 0;

        // Iterate through the dates corresponding to each case
        caseRawDates.forEach((rawDate) => {
          if (
            (cumulative && rawDate <= date) ||
            (!cumulative && rawDate === date)
          )
            casesValue++;
        });

        newCaseValues[i] = casesValue;

        for (let j = 0; j < this.avgPeriod; j++)
          prevPeriodTotals[i + j] += casesValue;
      });

      const normalChartDatasets = [
        {
          name: `${cumulative ? "Total" : "New"} cases`,
          // Remove the first avgPeriod-1 days
          values: newCaseValues.slice(
            this.avgPeriod - 1,
            this.chartNumDays + this.avgPeriod - 1
          ),
          chartType: cumulative ? "line" : "bar",
        },
      ];
      if (this.avgPeriod !== 1)
        normalChartDatasets.push({
          name: `${this.avgPeriod} day avg`,
          // Remove the first avgPeriod-1 days, and the last avgPeriod-1 days
          // after period added by the for loop, which will be NaN (null + num)
          values: prevPeriodTotals
            .slice(this.avgPeriod - 1, this.chartNumDays + this.avgPeriod - 1)
            .map((n) => n / this.avgPeriod),
          chartType: "line",
        });

      console.timeEnd("Calculate normalChartDatasets");
      return normalChartDatasets;
    },
    sourceChartDatasets() {
      console.time("Calculate sourceChartDatasets");
      const SOURCES = ["Local", "Interstate", "Overseas"];

      const cumulative = !this.newCasesMode;
      let values = {};
      SOURCES.forEach(
        (source) => (values[source] = new Array(this.chartNumDays).fill(0))
      );

      const caseRawDates = this.allCases.map((c) => c.rawDate);
      const caseSources = this.allCases.map((c) => c.source);

      this.rawDates
        // Remove the first avgPeriod-1 days
        .slice(this.avgPeriod - 1, this.chartNumDays + this.avgPeriod - 1)
        // Interate through each date
        .forEach((date, dateIndex) => {
          // Iterate through the sources corresponding to each case
          caseSources.forEach((source, i) => {
            if (
              ((cumulative && caseRawDates[i] <= date) ||
                (!cumulative && caseRawDates[i] === date)) &&
              values[source]
            )
              values[source][dateIndex]++;
          });
        });

      const sourceChartDatasets = SOURCES.map((targetSource) => ({
        name: targetSource,
        values: values[targetSource],
      }));

      console.timeEnd("Calculate sourceChartDatasets");
      return sourceChartDatasets;
    },
    chartDatasets() {
      return this.sourceMode
        ? this.sourceChartDatasets
        : this.normalChartDatasets;
    },
    chartOptions() {
      return {
        type: this.sourceMode ? "bar" : "axis-mixed",
        // Possibly todo later - make graphs line up
        // regardless of if legend is present:
        // height: this.sourceMode ? 340 : 300,
        height: 300,
        colors: this.sourceMode
          ? ["blue", "orange", "light-green"]
          : this.newCasesMode
          ? ["light-blue", "green"]
          : ["purple"],
        valuesOverPoints:
          !this.sourceMode && !this.allTimeMode && !this.outbreakMode,
        tooltipOptions: { formatTooltipY: (n) => n },
        lineOptions: {
          regionFill: 1,
          hideDots:
            this.allTimeMode || this.outbreakMode || this.newCasesMode ? 1 : 0,
        },
        axisOptions: {
          xIsSeries: true,
          xAxisMode: this.allTimeMode ? "tick" : "span",
        },
        barOptions: { stacked: this.sourceMode ? 1 : 0, spaceRatio: 0.25 },
        animate: false,
      };
    },
    chartData() {
      return {
        labels: this.chartLabels,
        datasets: this.chartDatasets,
        // Workaround so Y-axis starts at zero, see:
        // https://github.com/frappe/charts/issues/86#issuecomment-375557382
        // It'll only kick in when needed, which is when type=line (i.e. sourceMode
        // is false) and there is not already a zero value in the dataset.
        yMarkers:
          !this.sourceMode && !this.chartDatasets[0].values.includes(0)
            ? [{ label: "", value: 0 }]
            : [],
      };
    },
  },
  watch: {
    chartData() {
      console.log("chartOptions watcher called");
      this.createChart();
    },
  },
  methods: {
    mainContentRendered() {
      console.log("mainContentRendered event");
      this.createChart();
    },
    createChart() {
      // Check that chart div is present
      if (this.$refs.chart) {
        const chart = new Chart(`#chart`, {
          data: this.chartData,
          ...this.chartOptions,
        });
        chart.update(this.chartData);
      }
    },
    setPageMetadata() {
      if (this.$route.name === "CouncilPage") {
        this.$store.commit(
          "setPageTitle",
          `COVID-19 data for ${this.councilName}, NSW, Australia`
        );

        this.$store.commit(
          "setPageDescription",
          `As of ${this.$store.state.temporalCoverageTo.format(
            "D MMMM YYYY"
          )}, there are ${this.totalCases} cases of COVID-19 in ${
            this.councilName
          }. Click to see the latest data for your area.`
        );
      } else {
        this.$store.commit(
          "setPageTitle",
          `COVID-19 data for the postcode ${this.$route.params.postcode}, NSW, Australia`
        );

        this.$store.commit(
          "setPageDescription",
          `As of ${this.$store.state.temporalCoverageTo.format(
            "D MMMM YYYY"
          )}, there are ${this.totalCases} cases of COVID-19 in the postcode ${
            this.$route.params.postcode
          }. Click to see the latest data for your postcode.`
        );
      }
    },
  },
  created() {
    this.setPageMetadata();
  },
};
</script>

<style lang="scss">
$top-grid-breakpoint: 750px;
$top-grid-small-text-breakpoint: 370px;

.top-grid {
  display: flex;
  align-items: center;
  @media screen and (max-width: $top-grid-breakpoint) {
    flex-direction: column;
  }

  h1 {
    margin: 0;
    margin-right: 1rem;
    height: 100%;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-weight: 800;

    .not-bold {
      // opacity: 0.7;
      font-weight: 600;

      // @media screen and (max-width: $top-grid-breakpoint) {
      display: block;
      font-size: 1.2rem;
      opacity: 0.6;
      // }
    }

    @media screen and (max-width: $top-grid-breakpoint) {
      text-align: center;
      margin-right: 0;
      margin-bottom: 0.7rem;
      font-size: 1.7rem;
    }

    @media screen and (max-width: $top-grid-small-text-breakpoint) {
      font-size: 1.5rem;
    }

    .suburbs-text {
      font-weight: normal;
      font-size: 0.9rem;
      font-weight: 500;
      margin-top: 0.1rem;
    }
  }
  .stat-numbers {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    flex-shrink: 0;
    border: none;
    padding: 0;

    &-item {
      border: none;
      text-align: center;
      border: 1px none #eee;
      border-left-style: solid;
      padding: 0 0.75rem;

      @media screen and (max-width: $top-grid-breakpoint) {
        &:first-child {
          border-left-style: none;
        }
      }

      &-num {
        font-weight: bold;
        font-size: 2.5rem;

        @media screen and (max-width: $top-grid-breakpoint) {
          font-size: 2rem;
        }
      }

      &-label {
        opacity: 0.5;
        font-size: 0.9em;
      }
    }
  }
}
.main-chart {
  // Values from here (divided by -2)
  // https://github.com/frappe/charts/issues/92
  margin: -5px -30px;
  // margin-right calculated through trial-and-error
  margin-right: -23px;
  // Hard-coded height measured in DevTools so the page doesn't scroll
  // back to the top when the contents are briefly removed and re-rendered.
  height: 303.5px;
  // height: 343.5px;

  .chart-container svg.frappe-chart.chart {
    max-width: 100%;
  }
}
.chart-config {
  margin: 1rem 0;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;

  &-row {
    &-name {
      @media screen and (max-width: 520px) {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.8rem;
        font-weight: 600;
        opacity: 0.6;
      }
    }

    button {
      background: #eee;
      border: none;
      border-radius: 5px;
      font: inherit;
      color: inherit;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
      padding: 2px 4px;
      cursor: pointer;

      &:last-child {
        margin-right: 0;
      }

      @media screen and (max-width: 365px) {
        .non-compact {
          display: none;
        }
      }

      &:hover,
      &:focus {
        background: #ddd;
        outline: none;
      }

      &.active,
      &:active {
        background: #ccc;
      }
    }

    label {
      user-select: none;
      display: inline-block; // So the contents doesn't wrap
      margin-bottom: 0.5rem; // margin-bottom consistent with buttons
    }
  }
}
.alerts-link {
  display: block;
  width: 100%;
  color: inherit;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  border-radius: 7px;
  border: 1px solid hsl(0, 0%, 80%);
  background: hsl(0, 0%, 97%);

  &:hover {
    background: hsl(0, 0%, 96%);
  }

  &:active {
    background: hsl(0, 0%, 95%);
  }
}
.add-to-home-screen {
  font: inherit;
  padding: 1rem;
  width: 100%;
  background: hsl(274, 100%, 66%);
  color: hsl(0, 0%, 100%);
  border: none;
  border-radius: 0.5rem;
  margin: 1rem 0;
  cursor: pointer;
}

@media screen and (max-width: 740px) {
  .chart-time-period-changer {
    .last-updated {
      float: unset;
      display: block;
      margin-top: 1em;
    }
  }
}
</style>
