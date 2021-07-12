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
      type="axis-mixed"
      :height="300"
      :colors="['purple', 'light-blue', '#ffa3ef']"
      :dataSets="chartData"
      :valuesOverPoints="chartNumDays < allTimeDays"
      :tooltipOptions="{ formatTooltipY: (n) => n }"
      :lineOptions="{ regionFill: 1, hideDots: isAllTimeMode ? 1 : 0 }"
      :axisOptions="{
        xIsSeries: true,
        xAxisMode: isAllTimeMode ? 'tick' : 'span',
      }"
      :key="isAllTimeMode"
    >
    </vue-frappe>
    <p class="chart-time-period-changer">
      Graph time period = &nbsp;&nbsp;
      <button @click="chartNumDays = 7" :class="{ active: chartNumDays === 7 }">
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
        :class="{ active: isAllTimeMode }"
      >
        All time
      </button>
      <span v-if="lastUpdatedString" class="last-updated">
        Last updated {{ lastUpdatedString }}
      </span>
    </p>
    <hr />
    <!-- <button class="add-to-home-screen">Add to home screen</button> -->
    <p class="small-screen-warning">
      <i>Note: This graph is best viewed on a larger screen</i>
    </p>
    <ExplainerText />
    <!-- <pre style="text-align: left">{{
      JSON.stringify(allCases, null, 2)
    }}</pre> -->
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
    if (window.innerWidth < 700) {
      chartNumDays = 7;
    } else if (window.innerWidth < 1000) {
      chartNumDays = 14;
    } else if (window.innerWidth < 1284) {
      chartNumDays = 21;
    } else {
      chartNumDays = 28;
    }

    return {
      chartNumDays,
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
    chartLabels() {
      return this.lastXDays.map((date) => date.format("D MMM"));
    },
    cumulativeValues() {
      return this.lastXDays.map((date) => this.getCumulativeCasesOnDate(date));
    },
    newCaseValues() {
      return this.lastXDays.map((date) => this.getNewCasesOnDate(date));
    },
    chartData() {
      return [
        {
          name: "Total cases",
          chartType: "line",
          values: this.cumulativeValues,
        },
        {
          name: "New cases",
          chartType: "line",
          values: this.newCaseValues,
        },
      ];
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
    isAllTimeMode() {
      return this.chartNumDays === this.allTimeDays;
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
.chart-time-period-changer {
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
  .last-updated {
    float: right;
    opacity: 0.6;
  }
}
hr {
  border-style: solid;
  border-color: #ddd;
  margin-top: -0.5rem;
}
.small-screen-warning {
  opacity: 0.5;
  display: none;
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

@media screen and (max-width: 1367px) {
  .small-screen-warning {
    display: block;
  }
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
