<template>
  <div class="postcode-page-error" v-if="$store.state.error">
    ⚠ {{ $store.state.error }}
  </div>
  <div
    class="postcode-page-loading"
    v-else-if="
      $store.state.cases.length === 0 || !$store.state.temporalCoverageTo
    "
  >
    Loading&hellip;
  </div>
  <div class="postcode-page" v-else>
    <div class="top-grid">
      <h1>
        <span
          ><span class="not-postcode">COVID-19 data for the postcode</span>
          {{ postcodeNumber }}</span
        >
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
      :valuesOverPoints="true"
      :tooltipOptions="{ formatTooltipY: n => n }"
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
      <span v-if="lastUpdatedString" class="last-updated">
        Last updated {{ lastUpdatedString }}
      </span>
    </p>
    <hr />
    <!-- <button class="add-to-home-screen">Add to home screen</button> -->
    <p class="small-screen-warning">
      <i>Note: This graph is best viewed on a larger screen</i>
    </p>
    <p>
      The data above is official data provided by the NSW Ministry of Health,
      and is fetched fresh every time you load this page.
    </p>
    <p>
      You can view and download the raw data from the NSW Ministry of Health
      <a
        href="https://data.nsw.gov.au/data/dataset/covid-19-cases-by-location"
        target="_blank"
        >here</a
      >.
    </p>
    <p>
      This site was built by
      <a href="https://twitter.com/Booligoosh" target="_blank">Ethan</a>, and is
      not affiliated with the NSW government in any way.
    </p>
    <!-- <pre style="text-align: left">{{
      JSON.stringify(allCasesInPostcode, null, 2)
    }}</pre> -->
  </div>
</template>

<script>
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);

export default {
  name: "PostcodePage",
  created() {
    this.$store.state.pageTitle = `COVID-19 data for the postcode ${this.postcodeNumber}, NSW, Australia`;
    this.updateDescription();
  },
  watch: {
    "$store.state.temporalCoverageTo": function() {
      this.updateDescription();
    }
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
      chartNumDays
    };
  },
  computed: {
    postcodeNumber() {
      return Number(this.$route.params.postcode);
    },
    allCasesInPostcode() {
      return this.$store.state.cases.filter(
        ({ postcode }) => postcode === this.postcodeNumber
      );
    },
    currentCases() {
      return this.allCasesInPostcode.length;
    },
    lastXDays() {
      return Array(this.chartNumDays)
        .fill(0)
        .map((_, i) => this.$store.state.temporalCoverageTo.subtract(i, "days"))
        .reverse();
    },
    chartLabels() {
      return this.lastXDays.map(date => date.format("D MMM"));
    },
    cumulativeValues() {
      return this.lastXDays.map(date => this.getCumulativeCasesOnDate(date));
    },
    newCaseValues() {
      return this.lastXDays.map(date => this.getNewCasesOnDate(date));
    },
    chartData() {
      return [
        {
          name: "Total cases",
          chartType: "line",
          values: this.cumulativeValues
        },
        {
          name: "New cases",
          chartType: "line",
          values: this.newCaseValues
        }
      ];
    },
    lastUpdatedString() {
      return this.$store.state.temporalCoverageTo.format("D MMMM");
    }
  },
  methods: {
    getCumulativeCasesOnDate(dayjsDate) {
      return this.allCasesInPostcode.filter(({ date }) =>
        date.isSameOrBefore(dayjsDate)
      ).length;
    },
    getNewCasesOnDate(dayjsDate) {
      return this.allCasesInPostcode.filter(({ date }) =>
        date.isSame(dayjsDate, "day")
      ).length;
    },
    updateDescription() {
      if (this.$store.state.temporalCoverageTo) {
        this.$store.state.pageDescription = `As of ${this.$store.state.temporalCoverageTo.format(
          "D MMMM YYYY"
        )}, there are ${this.currentCases} cases of COVID-19 in the postcode ${
          this.postcodeNumber
        }. Click to see how this number has changed over time, as well as new cases per day.`;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.postcode-page-loading,
.postcode-page-error {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.postcode-page-error {
  color: red;
}
.top-grid {
  display: grid;
  align-items: center;
  grid-template-columns: 1fr auto;

  > * {
    padding: 0 1rem;
    border-right: 1px solid #eee;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  h1 {
    margin: 0;
    padding-left: 0;
    font-weight: 900;
    .not-postcode {
      // opacity: 0.7;
      font-weight: 600;
    }
  }
  .current-cases {
    padding-right: 0;
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

@media screen and (max-width: 370px) {
  .top-grid {
    h1 {
      font-size: 1.2em;
    }
  }
}
</style>
