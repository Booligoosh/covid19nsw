<!-- This file resolves the /postcode and /council routes -->

<template>
  <PageNotFound
    v-if="isCouncil && councilNameIndex === -1"
    :isOnCouncilPage="true"
  />
  <div class="data-page" v-else>
    <RenderDetector @created="mainContentRendered" />
    <div class="top-grid" v-if="!$store.state.isEmbed">
      <h1 v-if="isCouncil">
        <span
          ><span class="not-bold">Cases in</span> {{ councilDisplayName }}</span
        >
      </h1>
      <h1 v-else>
        <span
          ><span class="not-bold">Cases in the postcode</span>
          {{ postcodeNumber }}</span
        >
        <div class="suburbs-text">
          {{ suburbsText }}
        </div>
        <div
          class="postcode-council-text"
          v-if="postcodeCouncilSlugs.length > 0"
        >
          Part of
          <span v-for="(slug, i) of postcodeCouncilSlugs" :key="slug">
            <router-link
              :to="{
                name: 'CouncilPage',
                params: { councilSlug: slug },
              }"
              >{{ postcodeCouncilDisplayNames[i] }}</router-link
            >
            {{ postcodeCouncilSlugs.length - 1 > i ? "& " : "" }}
          </span>
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
          <div class="stat-numbers-item-num">{{ caseCounts.total }}</div>
          <div class="stat-numbers-item-label">total cases</div>
        </div>
      </div>
    </div>
    <div id="chart" ref="chart" class="main-chart"></div>
    <div class="chart-config">
      <div class="chart-config-row">
        <span class="chart-config-row-name">Graph type: &nbsp;</span>
        <button
          @click="
            $store.commit('setNewCasesMode', false);
            $store.commit('setChartVaccineMode', false);
          "
          :class="{ active: !newCasesMode && !vaccineMode }"
        >
          Total cases
        </button>
        <button
          @click="
            $store.commit('setNewCasesMode', true);
            $store.commit('setChartVaccineMode', false);
          "
          :class="{ active: newCasesMode && !vaccineMode }"
        >
          New cases
        </button>
        <button
          v-if="!$store.state.isEmbed && vaccinePercentages"
          @click="$store.commit('setChartVaccineMode', true)"
          :class="{ active: !newCasesMode && vaccineMode }"
        >
          Vaccinations
        </button>
        <label v-show="!vaccineMode && $store.state.showSourceCheckbox">
          <input type="checkbox" @input="sourceCheckboxClickHandler" />
          By source
        </label>
      </div>
      <div class="chart-config-row">
        <span class="chart-config-row-name">Graph time period: &nbsp;</span>
        <button
          @click="$store.commit('setChartNumDays', [14, vaccineMode])"
          :class="{ active: chartNumDays === 14 }"
        >
          2<span class="non-compact">&nbsp;</span>w<span class="non-compact"
            >eeks</span
          >
        </button>
        <button
          @click="$store.commit('setChartNumDays', [28, vaccineMode])"
          :class="{ active: chartNumDays === 28 }"
        >
          4<span class="non-compact">&nbsp;</span>w<span class="non-compact"
            >eeks</span
          >
        </button>
        <button
          @click="
            $store.commit('setChartNumDays', [omicronOutbreakDays, vaccineMode])
          "
          :class="{ active: chartNumDays === omicronOutbreakDays }"
          v-if="!vaccineMode"
        >
          Since Omicron
        </button>
        <button
          @click="
            $store.commit('setChartNumDays', [deltaOutbreakDays, vaccineMode])
          "
          :class="{ active: chartNumDays === deltaOutbreakDays }"
          v-if="!vaccineMode"
        >
          Since Delta
        </button>
        <button
          @click="
            $store.commit('setChartNumDays', [ALL_TIME_FLAG, vaccineMode])
          "
          :class="{ active: allTimeMode }"
        >
          All-time
        </button>
      </div>
    </div>
    <div class="other-content" v-if="!$store.state.isEmbed">
      <div class="other-content-card" v-if="vaccinePercentages">
        <h2 class="other-content-card-title">Vaccinations</h2>
        <div class="vaccinations">
          <div class="vaccinations-card dose-1">
            <div class="vaccinations-card-num">
              <div class="vaccinations-card-num-text">
                {{ vaccinePercentages[0] }}
              </div>
              <div
                class="vaccinations-card-num-bar"
                :style="{
                  '--last-segment-progress': vaccineLastSegmentProgress[0],
                }"
              >
                <div
                  v-for="(segmentType, i) of vaccineSegments[0]"
                  :key="i"
                  :class="[
                    'vaccinations-card-num-bar-segment',
                    `type-${segmentType}`,
                    segmentType === 1 &&
                    isCouncil &&
                    vaccinePercentages[0] !== '95%+'
                      ? 'precise'
                      : '',
                  ]"
                />
              </div>
            </div>
            <div class="vaccinations-card-label">
              of residents have had their 1st dose
            </div>
          </div>
          <div class="vaccinations-card dose-2">
            <div class="vaccinations-card-num">
              <div class="vaccinations-card-num-text">
                {{ vaccinePercentages[1] }}
              </div>
              <div
                class="vaccinations-card-num-bar"
                :style="{
                  '--last-segment-progress': vaccineLastSegmentProgress[1],
                }"
              >
                <div
                  v-for="(segmentType, i) of vaccineSegments[1]"
                  :key="i"
                  :class="[
                    'vaccinations-card-num-bar-segment',
                    `type-${segmentType}`,
                    segmentType === 1 &&
                    isCouncil &&
                    vaccinePercentages[1] !== '95%+'
                      ? 'precise'
                      : '',
                  ]"
                />
              </div>
            </div>
            <div class="vaccinations-card-label">
              of residents have had their 2nd dose
            </div>
          </div>
        </div>
        <div class="vaccinations-note">
          {{ VACCINATIONS_NOTE }}
        </div>
      </div>
      <!-- <div class="other-content-card" v-if="!isCouncil">
        <h2 class="other-content-card-title">Alerts</h2>
        <router-link
          class="alerts-link"
          :to="{
            name: 'PostcodeAlertsPage',
            params: { postcode: postcodeNumber },
          }"
        >
          See alerts near {{ postcodeNumber }} →
        </router-link>
      </div> -->
      <div
        class="other-content-card"
        v-if="!isCouncil && censusData && population"
      >
        <h2 class="other-content-card-title">About this postcode</h2>
        <table class="census-data-table">
          <tr>
            <td>Population</td>
            <td>{{ formatNum(population) }}</td>
          </tr>
          <tr>
            <td>Median age</td>
            <td>{{ censusData[0] }} yrs</td>
          </tr>
          <tr>
            <td>Avg people per household</td>
            <td>{{ censusData[1] }}</td>
          </tr>
        </table>
        <div class="census-data-note">
          Population data from ABS 2020 estimated populations, all other data
          from the 2016 Census
        </div>
      </div>
      <div
        class="other-content-card"
        v-if="
          isCouncil &&
          postcodesInCouncil &&
          !SPECIAL_COUNCILS.includes(councilDisplayName)
        "
      >
        <h2 class="other-content-card-title">Postcodes in this council</h2>
        <div class="council-postcodes-note">
          Postcodes with 0 cases are not shown. Most postcodes that span
          multiple councils are assigned a single council by NSW Health.
        </div>
        <div class="council-postcodes">
          <router-link
            class="council-postcodes-postcode"
            v-for="postcode of postcodesInCouncil"
            :key="postcode.postcodeNumber"
            :to="{
              name: 'PostcodePage',
              params: { postcode: postcode.postcodeNumber },
            }"
          >
            <div class="council-postcodes-postcode-num">
              {{ postcode.postcodeNumber }}
            </div>
            <div class="council-postcodes-postcode-suburbs">
              {{ postcode.suburbs.join(", ") }}
            </div>
          </router-link>
        </div>
      </div>
    </div>
    <!-- <button class="add-to-home-screen">Add to home screen</button> -->
    <!-- <pre>{{ JSON.stringify(chartData, null, 2) }}</pre> -->
  </div>
</template>

<script>
import PageNotFound from "@/views/PageNotFound.vue";
import suburbsForPostcode from "@/data/suburbsForPostcode.json";
import {
  ALL_TIME_START_DATE,
  DELTA_OUTBREAK_START_DATE,
  OMICRON_OUTBREAK_START_DATE,
  POSTCODE_VACCINATIONS_START_DATE,
  COUNCIL_VACCINATIONS_START_DATE,
  VACCINATIONS_NOTE,
  ALL_TIME_FLAG,
  SPECIAL_COUNCILS,
} from "@/constants.js";
import {
  getVaccineRangeIndex,
  getVaccineRangeStringFromIndex,
  getCouncilDisplayName,
} from "@/functions.js";
import { Chart } from "frappe-charts";
import RenderDetector from "../components/RenderDetector.vue";
import postcodeDailyCases from "@/data/built/postcodeDailyCases.json";
import councilDailyCases from "@/data/built/councilDailyCases.json";
import councilVaccinations from "@/data/built/councilVaccinations.json";
import councilVaccinationHistory from "@/data/built/councilVaccinationHistory.json";
import postcodeVaccinations from "@/data/built/postcodeVaccinations.json";
import postcodeVaccinationHistory from "@/data/built/postcodeVaccinationHistory.json";
import postcodes from "@/data/built/postcodes.json";
import councilNames from "@/data/built/councilNames.json";
import postcodeCounts from "@/data/built/postcodeCounts.json";
import councilCounts from "@/data/built/councilCounts.json";
import postcodesForCouncil from "@/data/built/postcodesForCouncil.json";
import councilsForPostcode from "@/data/built/councilsForPostcode.json";
import populationByPostcode from "@/data/population/populationByPostcode.json";
import populationByCouncil from "@/data/population/populationByCouncil.json";
import censusDataByPostcode from "@/data/census/censusDataByPostcode.json";

const AVG_PERIOD = 7;

export default {
  name: "DataPage",
  components: {
    PageNotFound,
    RenderDetector,
  },
  data() {
    return {
      VACCINATIONS_NOTE,
      ALL_TIME_FLAG,
      SPECIAL_COUNCILS,
    };
  },
  computed: {
    vaccineMode() {
      return this.vaccinePercentages && this.$store.state.chartVaccineMode;
    },
    chartNumDays() {
      const chartNumDays = this.vaccineMode
        ? this.$store.state.vaccineChartNumDays
        : this.$store.state.casesChartNumDays;

      if (chartNumDays === ALL_TIME_FLAG) return this.allTimeDays;
      else return chartNumDays;
    },
    newCasesMode() {
      return !this.vaccineMode && this.$store.state.newCasesMode;
    },
    isCouncil() {
      return this.$route.name === "CouncilPage";
    },
    postcodeNumber() {
      return Number(this.$route.params.postcode);
    },
    postcodeIndex() {
      return postcodes.indexOf(this.postcodeNumber);
    },
    daysSinceCasesStart() {
      return (
        this.$store.state.temporalCoverageTo.diff(ALL_TIME_START_DATE, "day") +
        1
      );
    },
    daysSinceVaccinationStart() {
      const startDate = this.isCouncil
        ? COUNCIL_VACCINATIONS_START_DATE
        : POSTCODE_VACCINATIONS_START_DATE;
      return this.$store.state.temporalCoverageTo.diff(startDate, "day") + 1;
    },
    allTimeDays() {
      return this.vaccineMode
        ? this.daysSinceVaccinationStart
        : this.daysSinceCasesStart;
    },
    deltaOutbreakDays() {
      return (
        this.$store.state.temporalCoverageTo.diff(
          DELTA_OUTBREAK_START_DATE,
          "day"
        ) + 1
      );
    },
    omicronOutbreakDays() {
      return (
        this.$store.state.temporalCoverageTo.diff(
          OMICRON_OUTBREAK_START_DATE,
          "day"
        ) + 1
      );
    },
    suburbsText() {
      return (
        suburbsForPostcode[this.postcodeNumber]?.join(", ") ||
        "(Suburbs unknown)"
      );
    },
    councilNameIndex() {
      return councilNames
        .map((cn) => cn.replace(/ /g, "-").toLowerCase())
        .indexOf(this.$route.params.councilSlug);
    },
    councilName() {
      return councilNames[this.councilNameIndex];
    },
    councilDisplayName() {
      return getCouncilDisplayName(this.councilNameIndex);
    },
    postcodesInCouncil() {
      return postcodesForCouncil[this.councilNameIndex]?.map(
        (postcodeIndex) => {
          const postcodeNumber = postcodes[postcodeIndex];
          const suburbs = suburbsForPostcode[postcodeNumber];
          return { postcodeNumber, suburbs };
        }
      );
    },
    postcodeCouncilDisplayNames() {
      return (
        councilsForPostcode[this.postcodeIndex]?.map(getCouncilDisplayName) ||
        []
      );
    },
    postcodeCouncilSlugs() {
      return (
        councilsForPostcode[this.postcodeIndex]?.map((councilIndex) =>
          councilNames[councilIndex].replace(/ /g, "-").toLowerCase()
        ) || []
      );
    },
    population() {
      return this.isCouncil
        ? populationByCouncil[this.councilName]
        : populationByPostcode[this.postcodeNumber];
    },
    censusData() {
      if (this.isCouncil) return null;
      return censusDataByPostcode[this.postcodeNumber];
    },
    vaccinePercentages() {
      if (this.isCouncil)
        return councilVaccinations[this.councilNameIndex] || null;
      else return postcodeVaccinations[this.postcodeNumber] || null;
    },
    vaccineSegments() {
      return this.vaccinePercentages?.map((range) => {
        const currentSegmentIndex = getVaccineRangeIndex(range);
        console.log({ range, currentSegmentIndex });

        const segments = new Array(10)
          .fill()
          .map((_, i) =>
            i === currentSegmentIndex ? 1 : i < currentSegmentIndex ? 0 : 2
          );

        return segments;
      });
    },
    vaccineLastSegmentProgress() {
      if (!this.isCouncil) return [];
      return this.vaccinePercentages?.map((percent) => {
        // Returns what percentage filled the last segment should be.
        // For example, 32.8 would return 28%.

        const num = Number(percent.replace("%", ""));
        const lastSegmentValue = num - Math.floor(num / 10) * 10;
        return (lastSegmentValue * 10).toFixed(0) + "%";
      });
    },
    embedPostcodeIndices() {
      if (!this.$store.state.isEmbed) return [];
      const queriedPostcodes = new URLSearchParams(window.location.search)
        .get("postcodes")
        .split(",");
      return queriedPostcodes.map((p) => postcodes.indexOf(Number(p)));
    },
    caseCounts() {
      const { totalCases, newCasesThisWeek, newCasesToday } = this.isCouncil
        ? councilCounts
        : postcodeCounts;

      const key = this.isCouncil ? this.councilNameIndex : this.postcodeIndex;

      return {
        today: (newCasesToday[key] || 0).toLocaleString("en-AU"),
        thisWeek: (newCasesThisWeek[key] || 0).toLocaleString("en-AU"),
        total: (totalCases[key] || 0).toLocaleString("en-AU"),
      };
    },
    lastXDays() {
      if (!this.$store.state.temporalCoverageTo) return [];
      return Array(this.chartNumDays)
        .fill(0)
        .map((_, i) => this.$store.state.temporalCoverageTo.subtract(i, "days"))
        .reverse();
    },
    rawDates() {
      return this.lastXDays.map((date) =>
        date
          .format("YYYY-MM-DD")
          // Emulates getMinifiedDate function in fetchData.js:
          // - "2020" replaced with "0", "2021" replaced with "1" etc.
          // - Dashes removed
          .substr(3)
          .replace(/-/g, "")
      );
    },
    rawDatesSinceCasesStart() {
      return Array(this.daysSinceCasesStart)
        .fill(0)
        .map((_, i) =>
          this.$store.state.temporalCoverageTo
            .subtract(i, "days")
            .format("YYYY-MM-DD")
            // Emulates getMinifiedDate function in fetchData.js:
            // - "2020" replaced with "0", "2021" replaced with "1" etc.
            // - Dashes removed
            .substr(3)
            .replace(/-/g, "")
        )
        .reverse();
    },
    lastUpdatedString() {
      return this.$store.state.temporalCoverageTo.format("D MMMM");
    },
    allTimeMode() {
      return this.chartNumDays === this.allTimeDays;
    },
    outbreakMode() {
      return (
        this.chartNumDays === this.deltaOutbreakDays ||
        this.chartNumDays === this.omicronOutbreakDays
      );
    },
    chartLabels() {
      const format = "D MMM YYYY";
      return this.lastXDays.map((date) => date.format(format));
    },
    dailyCases() {
      const key = this.isCouncil ? this.councilNameIndex : this.postcodeIndex;
      const obj = this.isCouncil ? councilDailyCases : postcodeDailyCases;
      const dailyCasesInObjForm = obj[key] || {};
      const dailyCasesInArrayForm = this.rawDatesSinceCasesStart.map(
        (rawDate) => dailyCasesInObjForm[rawDate] || 0
      );
      return dailyCasesInArrayForm;
    },
    dailyCaseDatasets() {
      console.time("Calculate dailyCaseDatasets");

      const emptyArray = new Array(this.daysSinceCasesStart).fill(0);
      const newCases = this.dailyCases;
      const totalCases = [].concat(emptyArray);
      const avgNewCases = [].concat(emptyArray);

      let runningTotal = 0;
      // Interate through each date
      newCases.forEach((casesValue, i) => {
        // TOTAL CASES
        runningTotal += casesValue;
        totalCases[i] = runningTotal;

        // AVG-OF-X CASES
        // Sum today's new cases with the last AVG_PERIOD-1 day's cases
        // to get the total sum over the AVG_PERIOD, then find the avg
        let sum = casesValue;
        for (let j = AVG_PERIOD - 1; j > 0; j--) sum += newCases[i - j] || 0;
        avgNewCases[i] = (sum / AVG_PERIOD).toFixed(1);
      });

      console.timeEnd("Calculate dailyCaseDatasets");
      return { newCases, totalCases, avgNewCases };
    },
    normalChartDatasets() {
      console.time("Calculate normalChartDatasets");

      const { newCases, totalCases, avgNewCases } = this.dailyCaseDatasets;
      const normalChartDatasets = [];

      if (this.newCasesMode)
        normalChartDatasets.push(
          {
            name: "New cases",
            values: newCases.slice(-this.chartNumDays),
            chartType: "bar",
          },
          {
            name: `${AVG_PERIOD} day avg`,
            values: avgNewCases.slice(-this.chartNumDays),
            chartType: "line",
          }
        );

      if (!this.newCasesMode)
        normalChartDatasets.push({
          name: "Total cases",
          values: totalCases.slice(-this.chartNumDays),
          chartType: "line",
        });

      console.timeEnd("Calculate normalChartDatasets");
      return normalChartDatasets;
    },
    vaccineChartDatasets() {
      const [dose1History, dose2History] = this.isCouncil
        ? councilVaccinationHistory[this.councilNameIndex]
        : postcodeVaccinationHistory[this.postcodeNumber];

      const dose1Values = [];
      const dose2Values = [];

      const multiplier = this.isCouncil ? 1 : 10;

      this.rawDates.forEach((date) => {
        const dose1Index =
          dose1History[
            Object.keys(dose1History)
              .filter((dateKey) => dateKey <= date)
              .pop()
          ];
        dose1Values.push((dose1Index || 0) * multiplier);

        const dose2Index =
          dose2History[
            Object.keys(dose2History)
              .filter((dateKey) => dateKey <= date)
              .pop()
          ];
        dose2Values.push((dose2Index || 0) * multiplier);
      });

      return [
        {
          name: "1st dose",
          values: dose1Values,
          chartType: "line",
        },
        {
          name: "2nd dose",
          values: dose2Values,
          chartType: "line",
        },
      ];
    },
    chartDatasets() {
      return this.vaccineMode
        ? this.vaccineChartDatasets
        : this.normalChartDatasets;
    },
    chartOptions() {
      return {
        type: "axis-mixed",
        // Possibly todo later - make graphs line up
        // regardless of if legend is present:
        // height: this.sourceMode ? 315 : 275,
        height: 275,
        colors: this.vaccineMode
          ? // 60%, 40%: ["#6bc770", "#38943d"]
            // 70%, 30%:
            ["#90d594", "#2a6f2e"]
          : this.newCasesMode
          ? ["light-blue", "green"]
          : ["purple"],
        valuesOverPoints: !this.allTimeMode && !this.outbreakMode,
        tooltipOptions: {
          formatTooltipY: this.vaccineMode
            ? this.isCouncil
              ? // If the council % is EXACTLY 95.0, assume it's 95%+
                (n) => (n + "%").replace("95%", "95%+")
              : (n) => getVaccineRangeStringFromIndex(n / 10)
            : (n) => n,
        },
        lineOptions: {
          regionFill: 1,
          hideDots:
            this.allTimeMode ||
            this.outbreakMode ||
            this.newCasesMode ||
            this.vaccineMode
              ? 1
              : 0,
        },
        axisOptions: {
          xIsSeries: true,
          xAxisMode: this.allTimeMode || this.outbreakMode ? "tick" : "span",
        },
        barOptions: { spaceRatio: 0.25 },
        animate: false,
      };
    },
    chartData() {
      return {
        labels: this.chartLabels,
        datasets: this.chartDatasets,
        // Workaround so Y-axis starts at zero, see:
        // https://github.com/frappe/charts/issues/86#issuecomment-375557382
        // It'll only kick in when needed, which is when type=line and there
        // is not already a zero value in the dataset.
        yMarkers: [
          ...(!this.chartDatasets[0].values.includes(0) &&
          !this.chartDatasets[1]?.values.includes(0)
            ? [{ label: "", value: 0 }]
            : []),
          ...(this.vaccineMode ? [{ label: "", value: 100 }] : []),
        ],
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
    alert(str) {
      alert(str);
    },
    formatNum(num) {
      return num.toLocaleString("en-AU");
    },
    sourceCheckboxClickHandler() {
      this.$store.commit("hideSourceCheckbox");
      alert(
        `NSW Health has discontinued the source of infection dataset, meaning COVID-19 NSW can no longer show graphs by source. NSW Health's reason for discontinuation is below: \n\n"This dataset has been discontinued from 19 November 2021. NSW Health now reports daily COVID-19 cases as a total of local and overseas cases. With quarantine-free international travel, overseas origin of cases can no longer be determined immediately, but will be included in the COVID-19 weekly surveillance reports. The NSW COVID-19 cases by location dataset will continue to be published."`
      );
    },
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
          `COVID-19 data for ${this.councilDisplayName}, NSW, Australia`
        );

        this.$store.commit(
          "setPageDescription",
          `As of ${this.$store.state.temporalCoverageTo.format(
            "D MMMM YYYY"
          )}, there are ${this.caseCounts.thisWeek} cases of COVID-19 in ${
            this.councilDisplayName
          } this week. Click to see the latest data for your area.`
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
          )}, there are ${
            this.caseCounts.thisWeek
          } cases of COVID-19 in the postcode ${
            this.$route.params.postcode
          } this week. Click to see the latest data for your postcode.`
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
      margin-top: 0.1rem;
    }

    .postcode-council-text {
      margin-top: 0.4rem;
      font-weight: 400;
      font-size: 0.9rem;

      @media screen and (max-width: $top-grid-breakpoint) {
        font-size: 0.85rem;
        opacity: 0.8;
      }

      a {
        color: inherit;
        font-weight: 600;
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
        &:first-child {
          border-left-style: none;
        }
      }

      &-num {
        font-weight: 600;
        font-size: 2.5rem;

        @media screen and (max-width: $top-grid-breakpoint) {
          font-size: 1.5rem;
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
  height: 278.5px;
  // height: 318.5px;

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
      @media screen and (max-width: 675px) {
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

      // @media screen and (max-width: 525px) {
      //   .non-compact {
      //     display: none;
      //   }
      // }

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

.other-content {
  // margin-top: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 1rem;

  @media screen and (max-width: 700px) {
    grid-template-columns: 1fr;
  }

  &-card {
    padding: 1rem;
    border: 1px solid hsl(0, 0%, 80%);
    border-radius: 7px;
    height: max-content;
    // For some reason, this stops grid items stretching
    // and taking up more than their assigned `1fr` of space.
    // CSS is strange someitmes.
    // https://css-tricks.com/preventing-a-grid-blowout/
    min-width: 0;

    &-title {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
  }
}

.vaccinations {
  display: flex;
  flex-wrap: wrap;
  $horizontal-gap: 1.5rem;
  $vertical-gap: 0.5rem;
  margin: $vertical-gap * -0.5 $horizontal-gap * -0.5;
  max-width: 100%;

  &-card {
    margin: $vertical-gap * 0.5 $horizontal-gap * 0.5;
    max-width: 100%;

    &-num {
      font-size: 1.2rem;
      font-weight: 600;
      display: flex;
      align-items: center;

      &-text {
        width: 76px; // Measured in devtools based on widest possible string, "40-49%"
      }

      &-bar {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
        border-radius: 100px;
        overflow: hidden;
        flex-grow: 1;
        width: 194px; // Measured in devtools based on width matching 2nd dose label
        margin-left: 0.5rem;

        &-segment {
          height: 15px;

          &:not(:last-child) {
            margin-right: 1px;
          }

          $secondary-color: hsl(0, 0%, 88%);

          .dose-1 & {
            --primary-color: hsl(123, 45%, 60%);
          }
          .dose-2 & {
            --primary-color: hsl(123, 45%, 40%);
          }

          &.type-0 {
            background: var(--primary-color);
          }
          &.type-1 {
            $stripe-width: 2.5px;
            background: repeating-linear-gradient(
              -45deg,
              var(--primary-color),
              var(--primary-color) $stripe-width,
              $secondary-color $stripe-width,
              $secondary-color 2 * $stripe-width
            );

            &.precise {
              background: linear-gradient(
                90deg,
                var(--primary-color) var(--last-segment-progress),
                $secondary-color var(--last-segment-progress)
              );
            }
          }
          &.type-2 {
            background: $secondary-color;
          }
        }
      }
    }
    &-label {
      opacity: 0.8;
    }
  }

  &-note {
    font-size: 0.8rem;
    margin-top: 0.75rem;
    opacity: 0.5;
  }
}

.council-postcodes {
  &-note {
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
  }

  &-postcode {
    display: flex;
    align-items: center;
    padding: 0.35rem 0;
    color: inherit;
    text-decoration: none;
    border-top: 1px solid hsl(0, 0%, 90%);

    &:hover {
      background: hsl(0, 0%, 98%);
    }

    &:active {
      background: hsl(0, 0%, 97%);
    }

    &-num {
      margin-right: 0.5rem;
      font-weight: bold;
      font-size: 1.1rem;
      color: hsl(123, 50%, 28%);
      text-decoration: underline;
      min-width: 2.8rem;
    }

    &-suburbs {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.9rem;
      opacity: 0.9;
    }
  }
}

.census-data {
  &-table {
    width: 100%;
    border-collapse: collapse;

    td {
      border: 1px solid hsl(0, 0%, 75%);
      padding: 0.5rem;

      &:first-child {
        font-weight: 500;
        border-left: none;
        padding-left: 0;
      }

      &:last-child {
        border-right: none;
        padding-right: 0;
      }
    }

    tr {
      &:first-child td {
        border-top: none;
      }
      &:last-child td {
        border-bottom: none;
      }
    }
  }

  &-note {
    font-size: 0.8rem;
    margin-top: 0.5rem;
    opacity: 0.5;
  }
}

.alerts-link {
  display: block;
  width: max-content;
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
