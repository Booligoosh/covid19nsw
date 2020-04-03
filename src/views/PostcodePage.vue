<template>
  <div class="postcode-page-loading" v-if="$store.state.cases.length === 0">
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
      :valuesOverPoints="1"
      :tooltipOptions="{ formatTooltipY: n => n }"
    >
    </vue-frappe>
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
      <a href="https://ethan.link" target="_blank">Ethan</a>, and is not
      affiliated with the NSW government in any way.
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

const now = dayjs();

export default {
  name: "PostcodePage",
  created() {
    document.title = `COVID-19 data for the postcode ${this.postcodeNumber}`;
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
      return Array(30)
        .fill(0)
        .map((_, i) => now.subtract(i, "days"))
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
    }
  }
};
</script>

<style lang="scss" scoped>
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
.small-screen-warning {
  opacity: 0.5;
  display: none;
}

@media screen and (max-width: 1367px) {
  .small-screen-warning {
    display: block;
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
