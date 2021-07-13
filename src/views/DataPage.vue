<!-- This file resolves the /postcode and /council routes -->

<template>
  <div class="data-page-error" v-if="$store.state.error">
    ⚠ {{ $store.state.error }}
  </div>
  <div
    class="data-page-loading"
    v-else-if="
      $store.state.cases.length === 0 || !$store.state.temporalCoverageTo
    "
  >
    Loading&hellip;
  </div>
  <PageNotFound
    v-else-if="isCouncil && allCases.length === 0"
    :isOnCouncilPage="true"
  />
  <div class="data-page" v-else>
    <DataPageMetadataChanger
      :totalCases="currentCases"
      :councilName="councilName"
    />
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
      <div class="current-cases">
        <div class="num">{{ currentCases }}</div>
        <div class="label">total cases</div>
      </div>
    </div>
    <vue-frappe
      id="test"
      class="main-chart"
      :labels="chartLabels"
      title=""
      :type="sourceMode ? 'bar' : 'line'"
      :height="300"
      :colors="
        sourceMode
          ? ['blue', 'orange', 'light-green']
          : ['purple', 'light-blue']
      "
      :dataSets="chartData"
      :valuesOverPoints="!sourceMode && !allTimeMode"
      :tooltipOptions="{ formatTooltipY: (n) => n }"
      :lineOptions="{
        regionFill: 1,
        hideDots: allTimeMode ? 1 : 0,
      }"
      :axisOptions="{
        xIsSeries: true,
        xAxisMode: allTimeMode ? 'tick' : 'span',
      }"
      :barOptions="{ stacked: sourceMode ? 1 : 0 }"
      :key="chartKey"
    >
    </vue-frappe>
    <div class="chart-config">
      <div class="chart-config-row">
        Graph type = &nbsp;
        <button @click="sourceMode = false" :class="{ active: !sourceMode }">
          Total & New cases
        </button>
        <button @click="sourceMode = true" :class="{ active: sourceMode }">
          Total cases by source
        </button>
      </div>
      <div class="chart-config-row">
        Graph time period = &nbsp;
        <button
          @click="chartNumDays = 7"
          :class="{ active: chartNumDays === 7 }"
        >
          1 week
        </button>
        <button
          @click="chartNumDays = 14"
          :class="{ active: chartNumDays === 14 }"
        >
          2 weeks
        </button>
        <button
          @click="chartNumDays = 21"
          :class="{ active: chartNumDays === 21 }"
        >
          3 weeks
        </button>
        <button
          @click="chartNumDays = 28"
          :class="{ active: chartNumDays === 28 }"
        >
          4 weeks
        </button>
        <button
          @click="chartNumDays = allTimeDays"
          :class="{ active: allTimeMode }"
        >
          All time
        </button>
      </div>
    </div>
    <!-- <button class="add-to-home-screen">Add to home screen</button> -->
    <ExplainerText />
    <!-- <pre style="text-align: left">{{
      JSON.stringify(allCases, null, 2)
    }}</pre> -->
    <!-- <pre>{{ JSON.stringify(chartData, null, 2) }}</pre> -->
  </div>
</template>

<script>
import DataPageMetadataChanger from "@/components/DataPageMetadataChanger.vue";
import ExplainerText from "@/components/ExplainerText.vue";
import PageNotFound from "@/views/PageNotFound.vue";
import suburbsForPostcode from "@/data/suburbsForPostcode.json";

import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import minMax from "dayjs/plugin/minMax";
dayjs.extend(isSameOrBefore);
dayjs.extend(minMax);

export default {
  name: "DataPage",
  components: {
    DataPageMetadataChanger,
    ExplainerText,
    PageNotFound,
  },
  created() {
    const scriptEl = document.createElement("script");
    scriptEl.setAttribute("type", "application/ld+json");
    scriptEl.innerText = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: this.postcodeNumber.toString(),
          item: `https://covid19nsw.ethan.link/postcode/${this.postcodeNumber}`,
        },
      ],
    });
    document.querySelector("head").appendChild(scriptEl);
  },
  data() {
    let chartNumDays;
    if (window.innerWidth < 480) {
      // Same as $top-grid-breakpoint
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
      return suburbsForPostcode[this.postcodeNumber].join(", ");
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
    currentCases() {
      return this.allCases.length;
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
    chartLabels() {
      return this.lastXDays.map((date) => date.format("D MMM"));
    },
    normalChartData() {
      console.log(
        this.chartNumDays,
        this.currentCases,
        "Requires",
        this.chartNumDays * this.currentCases,
        "operations"
      );

      let cumulativeValues = [];
      let newCaseValues = [];
      const caseRawDates = this.allCases.map((c) => c.rawDate);

      // Interate through each date
      this.rawDates.forEach((date) => {
        let cumulativeCases = 0;
        let newCases = 0;

        // Iterate through the dates corresponding to each case
        caseRawDates.forEach((rawDate) => {
          if (rawDate <= date) cumulativeCases++;
          if (rawDate === date) newCases++;
        });

        cumulativeValues.push(cumulativeCases);
        newCaseValues.push(newCases);
      });

      return [
        {
          name: "Total cases",
          values: cumulativeValues,
        },
        {
          name: "New cases",
          values: newCaseValues,
        },
      ];
    },
    sourceChartData() {
      const SOURCES = ["Local", "Interstate", "Overseas"];

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
          if (caseRawDates[i] <= date) values[source][dateIndex]++;
        });
      });

      console.log(values);

      return SOURCES.map((targetSource) => ({
        name: targetSource,
        values: values[targetSource],
      }));
    },
    chartData() {
      return this.sourceMode ? this.sourceChartData : this.normalChartData;
    },
    lastUpdatedString() {
      return this.$store.state.temporalCoverageTo.format("D MMMM");
    },
    allTimeDays() {
      if (this.allCases.length === 0) {
        return 1;
      } else {
        const earliestDate = dayjs.min(this.allCases.map(({ date }) => date));
        const startDate = earliestDate.subtract(1, "day");
        return dayjs().diff(startDate, "day");
      }
    },
    allTimeMode() {
      return this.chartNumDays === this.allTimeDays;
    },
    chartKey() {
      return this.allTimeMode.toString() + this.sourceMode.toString();
    },
  },
  methods: {
    getCumulativeCasesOnDate(dayjsDate) {
      return this.allCases.filter(({ date }) => date.isSameOrBefore(dayjsDate))
        .length;
    },
    getNewCasesOnDate(dayjsDate) {
      return this.allCases.filter(({ date }) => date.isSame(dayjsDate, "day"))
        .length;
    },
  },
};
</script>

<style lang="scss" scoped>
$top-grid-breakpoint: 480px;

.data-page-loading,
.data-page-error {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.data-page-error {
  color: red;
}
.top-grid {
  display: grid;
  align-items: center;
  grid-template-columns: 1fr auto;
  @media screen and (max-width: $top-grid-breakpoint) {
    display: block;
  }

  > * {
    padding: 0 1rem;
    border: 1px none #eee;
    border-right-style: solid;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;

    @media screen and (max-width: $top-grid-breakpoint) {
      border-right-style: none;
      border-bottom-style: solid;
      padding: 1rem 0;
    }
  }

  h1 {
    margin: 0;
    padding-left: 0;
    padding-top: 0;
    font-weight: 900;
    .not-bold {
      // opacity: 0.7;
      font-weight: 600;
    }

    @media screen and (max-width: $top-grid-breakpoint) {
      text-align: center;
    }

    @media screen and (max-width: 370px) {
      font-size: 1.5em;
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
  .current-cases {
    padding-right: 0;
    padding-bottom: 0;
    border: none;
    text-align: center;
    .num {
      font-size: 3em;
      font-weight: bold;
    }
    .label {
      opacity: 0.5;
      font-size: 0.9em;
    }
  }
}
.main-chart {
  // Values from here (divided by -2)
  // https://github.com/frappe/charts/issues/92
  margin: -5px -30px;
  // margin-right calculated through trial-and-error
  margin-right: -23px;
}
.chart-config {
  margin: 1rem 0;

  &-row {
    button {
      background: #eee;
      border: none;
      border-radius: 5px;
      font: inherit;
      color: inherit;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
      cursor: pointer;

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
