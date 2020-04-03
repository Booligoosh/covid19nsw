<template>
  <div class="postcode-page-loading" v-if="$store.state.cases.length === 0">
    Loading&hellip;
  </div>
  <div class="postcode-page" v-else>
    <h1>COVID-19 data for the postcode {{ postcodeNumber }}</h1>
    <div>Current cases: {{ currentCases }}</div>
    <vue-frappe
      id="test"
      :labels="chartLabels"
      title=""
      type="axis-mixed"
      :height="300"
      :colors="['purple', 'light-blue', '#ffa3ef']"
      :dataSets="chartData"
      :valuesOverPoints="1"
    >
    </vue-frappe>
    <pre style="text-align: left">{{
      JSON.stringify(allCasesInPostcode, null, 2)
    }}</pre>
  </div>
</template>

<script>
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);

const now = dayjs();

export default {
  name: "PostcodePage",
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
    last30Days() {
      return Array(30)
        .fill(0)
        .map((_, i) => now.subtract(i, "days"))
        .reverse();
    },
    chartLabels() {
      return this.last30Days.map(date => date.format("DD MMM"));
    },
    cumulativeValues() {
      return this.last30Days.map(date => this.getCumulativeCasesOnDate(date));
    },
    newCaseValues() {
      return this.last30Days.map(date => this.getNewCasesOnDate(date));
    },
    chartData() {
      return [
        {
          name: "Cumulative cases",
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
