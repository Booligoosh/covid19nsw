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
    <DataPageMetadataChanger
      :totalCases="totalCases"
      :councilName="councilName"
    />
    <RenderDetector @created="mainContentRendered" />
    <div class="top-grid">
      <h1 v-if="isCouncil">
        <span
          ><span class="not-bold">COVID-19 data for the</span>
          {{ councilName }} <span class="not-bold">area</span></span
        >
      </h1>
      <h1 v-else>
        <span
          ><span class="not-bold">COVID-19 data for the postcode</span>
          {{ postcodeNumber }}</span
        >
        <div class="suburbs-text">
          Suburbs in this postcode:
          <span class="suburbs-text-suburbs">
            {{ suburbsText }}
          </span>
        </div>
      </h1>
      <div class="stat-numbers">
        <div class="stat-numbers-item">
          <div class="stat-numbers-item-num">{{ casesToday }}</div>
          <div class="stat-numbers-item-label">today</div>
        </div>
        <div class="stat-numbers-item">
          <div class="stat-numbers-item-num">{{ casesThisWeek }}</div>
          <div class="stat-numbers-item-label">this week</div>
        </div>
        <div class="stat-numbers-item">
          <div class="stat-numbers-item-num">{{ totalCases }}</div>
          <div class="stat-numbers-item-label">total</div>
        </div>
      </div>
    </div>
    <div id="chart" ref="chart" class="main-chart"></div>
    <div class="chart-config">
      <div class="chart-config-row">
        <span class="chart-config-row-name">Graph type: &nbsp;</span>
        <button
          @click="newCasesMode = false"
          :class="{ active: !newCasesMode }"
        >
          Total cases
        </button>
        <button @click="newCasesMode = true" :class="{ active: newCasesMode }">
          New cases
        </button>
        <label>
          <input type="checkbox" v-model="sourceMode" />
          By source
        </label>
      </div>
      <div class="chart-config-row">
        <span class="chart-config-row-name">Graph time period: &nbsp;</span>
        <button
          @click="chartNumDays = 7"
          :class="{ active: chartNumDays === 7 }"
        >
          1<span class="non-compact">&nbsp;</span>w<span class="non-compact"
            >eek</span
          >
        </button>
        <button
          @click="chartNumDays = 14"
          :class="{ active: chartNumDays === 14 }"
        >
          2<span class="non-compact">&nbsp;</span>w<span class="non-compact"
            >eeks</span
          >
        </button>
        <button
          @click="chartNumDays = 21"
          :class="{ active: chartNumDays === 21 }"
        >
          3<span class="non-compact">&nbsp;</span>w<span class="non-compact"
            >eeks</span
          >
        </button>
        <button
          @click="chartNumDays = 28"
          :class="{ active: chartNumDays === 28 }"
        >
          4<span class="non-compact">&nbsp;</span>w<span class="non-compact"
            >eeks</span
          >
        </button>
        <button
          @click="chartNumDays = allTimeDays"
          :class="{ active: allTimeMode }"
        >
          All time
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
import DataPageMetadataChanger from "@/components/DataPageMetadataChanger.vue";
import PageNotFound from "@/views/PageNotFound.vue";
import suburbsForPostcode from "@/data/suburbsForPostcode.json";

import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import minMax from "dayjs/plugin/minMax";
dayjs.extend(isSameOrBefore);
dayjs.extend(minMax);

import { Chart } from "frappe-charts";
import RenderDetector from "../components/RenderDetector.vue";

export default {
  name: "DataPage",
  components: {
    DataPageMetadataChanger,
    PageNotFound,
    RenderDetector,
  },
  data() {
    let chartNumDays;
    if (window.innerWidth < 480) {
      chartNumDays = 7;
    } else if (window.innerWidth < 650) {
      chartNumDays = 14;
    } else if (window.innerWidth < 800) {
      chartNumDays = 21;
    } else {
      chartNumDays = 28;
    }

    return {
      chartNumDays,
      allTimeDays: dayjs().diff("2020-01-25", "day"),
      newCasesMode: true,
      sourceMode: false,
    };
  },
  computed: {
    isCouncil() {
      return this.$route.name === "CouncilPage";
    },
    postcodeNumber() {
      return Number(this.$route.params.postcode);
    },
    suburbsText() {
      return suburbsForPostcode[this.postcodeNumber]?.join(", ") || "Unknown";
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
      // Both in 1 function to halve the number of iterations.
      // See the individual getters based on its outputs below.
      const todayDate =
        this.$store.state.temporalCoverageTo.format("YYYY-MM-DD");
      const oneWeekAgo = this.$store.state.temporalCoverageTo
        .subtract(7, "days")
        .format("YYYY-MM-DD");

      let today = 0;
      let thisWeek = 0;

      this.allCases.forEach((caseObj) => {
        if (caseObj.rawDate === todayDate) {
          today++;
          thisWeek++;
        } else if (caseObj.rawDate > oneWeekAgo) {
          thisWeek++;
        }
      });

      return { today, thisWeek };
    },
    casesToday() {
      return this.caseCounts.today;
    },
    casesThisWeek() {
      return this.caseCounts.thisWeek;
    },
    lastXDays() {
      return Array(this.chartNumDays)
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
    chartLabels() {
      const format = this.allTimeMode ? "D MMM YYYY" : "D MMM";
      return this.lastXDays.map((date) => date.format(format));
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
      let newCaseValues = [];
      const caseRawDates = this.allCases.map((c) => c.rawDate);

      // Interate through each date
      this.rawDates.forEach((date) => {
        let casesValue = 0;

        // Iterate through the dates corresponding to each case
        caseRawDates.forEach((rawDate) => {
          if (
            (cumulative && rawDate <= date) ||
            (!cumulative && rawDate === date)
          )
            casesValue++;
        });

        newCaseValues.push(casesValue);
      });

      console.timeEnd("Calculate normalChartDatasets");
      return [
        {
          name: `${cumulative ? "Total" : "New"} cases`,
          values: newCaseValues,
        },
      ];
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

      // Interate through each date
      this.rawDates.forEach((date, dateIndex) => {
        // Iterate through the sources corresponding to each case
        caseSources.forEach((source, i) => {
          if (
            (cumulative && caseRawDates[i] <= date) ||
            (!cumulative && caseRawDates[i] === date)
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
        type: this.sourceMode ? "bar" : "line",
        // Possibly todo later - make graphs line up
        // regardless of if legend is present:
        // height: this.sourceMode ? 340 : 300,
        height: 300,
        colors: this.sourceMode
          ? ["blue", "orange", "light-green"]
          : this.newCasesMode
          ? ["light-blue"]
          : ["purple"],
        valuesOverPoints: !this.sourceMode && !this.allTimeMode,
        tooltipOptions: { formatTooltipY: (n) => n },
        lineOptions: {
          regionFill: 1,
          hideDots: this.allTimeMode ? 1 : 0,
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
  },
};
</script>

<style lang="scss" scoped>
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
    font-weight: 900;

    .not-bold {
      // opacity: 0.7;
      font-weight: 600;
    }

    @media screen and (max-width: $top-grid-breakpoint) {
      text-align: center;
      margin-right: 0;
      margin-bottom: 1rem;
    }

    @media screen and (max-width: $top-grid-small-text-breakpoint) {
      font-size: 1.5rem;
    }

    .suburbs-text {
      font-weight: normal;
      opacity: 0.8;
      font-size: 0.95rem;
      margin-top: 0.2rem;

      @media screen and (max-width: $top-grid-breakpoint) {
        margin-top: 0.7rem;
      }

      &-suburbs {
        font-weight: 500;
      }
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
        border-right-style: solid;
      }

      &-num {
        font-weight: bold;
        font-size: 2.5rem;

        @media screen and (max-width: $top-grid-small-text-breakpoint) {
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
}
.chart-config {
  margin: 1rem 0;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;

  &-row {
    &-name {
      @media screen and (max-width: 460px) {
        display: block;
        margin-bottom: 0.5rem;
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
      cursor: pointer;

      &:last-child {
        margin-right: 0;
      }

      @media screen and (max-width: 580px) {
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

<style lang="scss">
// Unscoped
.data-page .chart-container svg.frappe-chart.chart {
  max-width: 100%;
}
</style>
