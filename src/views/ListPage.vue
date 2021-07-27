<template>
  <div class="all-page">
    <div class="chooser" v-if="!councilMode">
      <h2 class="chooser-title">See data for your postcode&hellip;</h2>
      <PostcodePicker @submit="postcodeSubmitHandler" />
    </div>
    <h1 class="table-title">
      COVID-19 cases by {{ councilMode ? "council" : "postcode" }}
    </h1>
    <div class="table-subtitle" v-if="lastUpdatedString">
      Data up to <mark>{{ lastUpdatedString }}</mark
      >, updated daily by NSW Health at around 2pm.
    </div>
    <div class="page-error" v-if="$store.state.error">
      ⚠ {{ $store.state.error }}
    </div>
    <div class="page-loading" v-else-if="$store.state.cases.length === 0">
      Loading&hellip;
    </div>
    <div class="table" v-else>
      <table>
        <thead>
          <tr>
            <th class="primary-col">
              <a
                v-if="councilMode"
                href="#"
                @click.prevent="sort = 'col1Sort'"
                title="Sort by Council/LGA"
              >
                Council/LGA
                <span v-if="sort === 'col1Sort'">▼</span>
              </a>
              <a
                v-else
                href="#"
                @click.prevent="sort = 'col1Sort'"
                title="Sort by Postcode"
              >
                Postcode
                <span v-if="sort === 'col1Sort'">▼</span>
              </a>
            </th>
            <th class="num-col">
              <a
                href="#"
                @click.prevent="sort = 'newCasesToday'"
                title="Sort by Cases today"
              >
                Today
                <span v-if="sort === 'newCasesToday'">▼</span>
              </a>
            </th>
            <th class="num-col">
              <a
                href="#"
                @click.prevent="sort = 'newCasesThisWeek'"
                title="Sort by Cases this week"
              >
                This week
                <span v-if="sort === 'newCasesThisWeek'">▼</span>
              </a>
            </th>
            <th class="num-col">
              <a
                href="#"
                @click.prevent="sort = 'totalCases'"
                title="Sort by Total cases"
              >
                Total <span v-if="sort === 'totalCases'">▼</span>
              </a>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="value in truncate
              ? postcodeRowsSortedTruncated
              : postcodeRowsSorted"
            :key="value.postcodeNumber"
            role="button"
            @click="
              $router.push(
                councilMode
                  ? {
                      name: 'CouncilPage',
                      params: { councilSlug: value.councilSlug },
                    }
                  : {
                      name: 'PostcodePage',
                      params: { postcode: value.postcodeNumber },
                    }
              )
            "
          >
            <td class="council-name" v-if="councilMode">
              <router-link
                :to="{
                  name: 'CouncilPage',
                  params: { councilSlug: value.councilSlug },
                }"
                >{{ value.councilName }}</router-link
              >
            </td>
            <td class="postcode-number" v-else>
              <router-link
                :to="{
                  name: 'PostcodePage',
                  params: { postcode: value.postcodeNumber },
                }"
                >{{ value.postcodeNumber }}</router-link
              >&nbsp;
              <div class="suburbs">{{ value.suburbs }}</div>
            </td>
            <td class="value-number">{{ value.newCasesToday }}</td>
            <td class="value-number">{{ value.newCasesThisWeek }}</td>
            <td class="value-number">{{ value.totalCases }}</td>
          </tr>
        </tbody>
      </table>
      <button
        class="bottom-row load-more-btn"
        v-if="truncate && rowCount > TRUNCATE_SIZE"
        @click="truncate = false"
      >
        Show more rows ↓
      </button>
      <div class="bottom-row no-postcodes-note" v-else>
        {{ councilMode ? "Councils" : "Postcodes" }} with 0 total cases are not
        shown.
      </div>
    </div>
  </div>
</template>

<script>
import PostcodePicker from "../components/PostcodePicker.vue";

import suburbsForPostcode from "@/data/suburbsForPostcode.json";

import postcodes from "@/data/built/postcodes.json";
import councilNames from "@/data/built/councilNames.json";

const postcodesLength = postcodes.length;
const councilNamesLength = councilNames.length;

export default {
  components: { PostcodePicker },
  name: "ListPage",
  data() {
    return {
      TRUNCATE_SIZE: 115,
      truncate: true,
      sort: "newCasesThisWeek",
    };
  },
  computed: {
    councilMode() {
      return (
        this.$route.name === "CouncilsPage" ||
        // This second line prevents a complex bug where, when clicking on the
        // router-link, the @click handler on the <tr> fires before the router-link
        // click is recorded, changing this.$route.name away from CouncilsPage to
        // CouncilPage before the click. This means that without the line below,
        // the router-link click would register after councilMode becomes false,
        // meaning it wrongly navigates to the PostcodePage.
        this.$route.name === "CouncilPage"
      );
    },
    postcodeRowsSortedTruncated() {
      console.time("Truncating postcodeRowsSorted");
      const postcodeRowsSortedTruncated = this.postcodeRowsSorted.slice(
        0,
        this.TRUNCATE_SIZE
      );
      console.timeEnd("Truncating postcodeRowsSorted");
      return postcodeRowsSortedTruncated;
    },
    postcodeRowsSorted() {
      console.time("Sort postcodeRows");
      const postcodeRowsSorted = [].concat(this.postcodeRows).sort((a, b) =>
        // If values are the same, return zero
        a[this.sort] === b[this.sort]
          ? 0
          : // If A is less than B, put A after B
            (a[this.sort] < b[this.sort] ? 1 : -1) *
            // Unless it's col1, in which case reverse the order
            (this.sort === "col1Sort" ? -1 : 1)
      );
      console.timeEnd("Sort postcodeRows");
      return postcodeRowsSorted;
    },
    postcodeRows() {
      console.time("Calculate postcodeRows");
      // Initialise objects
      const totalCases = {};
      const newCasesThisWeek = {};
      const newCasesToday = {};

      // Calculate dates to compare to
      const today = this.$store.state.temporalCoverageTo.format("YYYY-MM-DD");
      const oneWeekAgo = this.$store.state.temporalCoverageTo
        .subtract(7, "days")
        .format("YYYY-MM-DD");

      const identifierKey = this.councilMode ? "councilName" : "postcode";

      // Iterate through each case
      this.$store.state.cases.forEach((caseObj) => {
        const identifier = caseObj[identifierKey];
        // Add the case to its postcode/council's total cases
        totalCases[identifier] = (totalCases[identifier] || 0) + 1;
        // If the case is today, add it to its postcode/council's cases today & this week
        if (caseObj.rawDate === today) {
          newCasesToday[identifier] = (newCasesToday[identifier] || 0) + 1;
          newCasesThisWeek[identifier] =
            (newCasesThisWeek[identifier] || 0) + 1;
        }
        // Otherwise if the case is this week, add it to its postcode/council's cases this week
        else if (caseObj.rawDate > oneWeekAgo) {
          newCasesThisWeek[identifier] =
            (newCasesThisWeek[identifier] || 0) + 1;
        }
      });

      // Return postcodes/councils using precalculated values
      const postcodeRows = this.councilMode
        ? councilNames.map((councilName) => ({
            councilName,
            col1Sort: councilName,
            councilSlug: councilName.replace(/ /g, "-").toLowerCase(),
            totalCases: totalCases[councilName] || 0,
            newCasesThisWeek: newCasesThisWeek[councilName] || 0,
            newCasesToday: newCasesToday[councilName] || 0,
          }))
        : postcodes.map((postcodeNumber) => ({
            postcodeNumber,
            col1Sort: postcodeNumber,
            totalCases: totalCases[postcodeNumber] || 0,
            newCasesThisWeek: newCasesThisWeek[postcodeNumber] || 0,
            newCasesToday: newCasesToday[postcodeNumber] || 0,
            suburbs: suburbsForPostcode[postcodeNumber].join(", "),
          }));

      console.timeEnd("Calculate postcodeRows");
      return postcodeRows;
    },
    rowCount() {
      return this.councilMode ? councilNamesLength : postcodesLength;
    },
    lastUpdatedString() {
      return this.$store.state.temporalCoverageTo?.format("ddd D MMMM");
    },
  },
  methods: {
    postcodeSubmitHandler(postcode) {
      this.$router.push({
        name: "PostcodePage",
        params: { postcode },
      });
    },
    suburbsSeeMoreClickHandler(event) {
      event.preventDefault();
      event.target.parentElement.classList.add("show-full");
    },
  },
};
</script>

<style lang="scss" scoped>
$compact-breakpoint: 492px;
$table-title-breakpoint: 460px;
$fixed-num-col-width-breakpoint: 589px;

.all-page {
  width: 948px !important;
}

.chooser {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid hsl(0, 0%, 80%);
  border-radius: 7px;

  &-title {
    margin: 0;
    font-weight: 500;
    text-align: center;
    font-size: 1.3rem;

    @media screen and (max-width: $table-title-breakpoint) {
      // Shrinks font-size by ~77%, about the
      // same as the table title font size
      font-size: 1rem;
    }
  }
}

.table-title {
  margin-bottom: 0;
  margin-top: 2rem;
  text-align: center;
  font-size: 1.8rem;

  @media screen and (max-width: $table-title-breakpoint) {
    font-size: 1.4rem;
  }
}
.table-subtitle {
  margin-top: 0.1rem;
  margin-bottom: 2rem;
  text-align: center;
  opacity: 0.8;

  @media screen and (max-width: $table-title-breakpoint) {
    font-size: 0.95rem;
    margin-top: 0.3rem;
  }

  mark {
    font-weight: 500;
    background: hsl(0, 0%, 90%);
  }
}

$table-border: 1px solid hsl(0, 0%, 50%);
$table-border-radius: 7px;

.table {
  width: 100%;
  margin: 0 auto;

  @media screen and (max-width: $compact-breakpoint) {
    margin-left: -1.5rem;
    width: calc(100% + 3rem);
  }

  table {
    width: 100%;
    border-spacing: 0;
  }

  tbody tr {
    cursor: pointer;

    &:hover {
      background: hsl(0, 0%, 98%);
    }

    &:active {
      background: hsl(0, 0%, 97%);
    }
  }

  thead tr {
    z-index: 1;
    background: white;
    position: sticky;
    top: 0;

    @media screen and (max-width: $compact-breakpoint) {
      top: -1px;
    }
  }

  th {
    text-align: left;
    background: hsl(0, 0%, 95%);
    border-top: $table-border;

    &:first-child {
      border-top-left-radius: $table-border-radius;
    }
    &:last-child {
      border-top-right-radius: $table-border-radius;
    }

    &.num-col {
      @media screen and (min-width: $fixed-num-col-width-breakpoint + 1) {
        width: 9rem;
      }
    }
    &.primary-col {
      @media screen and (max-width: $fixed-num-col-width-breakpoint) {
        width: 100%;
      }
    }

    a {
      color: inherit;
      text-decoration: none;
      padding: 1px 0;

      // Use a grid layout so the space for the sort arrow is preserved even when
      // it's not there, preventing columns resizing when sorting is changed.
      display: grid;
      // 13px for size of sort arrow
      grid-template-columns: auto 13px;
      grid-gap: 4px;
      justify-content: space-between;
      align-items: center;

      span {
        font-size: 0.75em;
      }
    }
  }

  th,
  td,
  .bottom-row {
    padding: 0.5rem 1rem;
    border-right: $table-border;

    &:first-child {
      border-left: $table-border;
    }

    @media screen and (max-width: $compact-breakpoint) {
      padding: 0.4rem;
      border-radius: 0 !important;
      border-left: none !important;
      &:last-child {
        border-right: none;
      }
    }
  }

  tr {
    th,
    td {
      border-bottom: $table-border;
    }
  }

  td.value-number,
  td.postcode-number,
  td.council-name {
    font-size: 1.5em;
    font-weight: 500;
  }

  td.value-number {
    // Align numbers to top of cell rather than middle
    vertical-align: baseline;
  }

  td.postcode-number,
  td.council-name {
    font-weight: bold;

    a {
      color: hsl(123, 50%, 28%);
    }

    .suburbs {
      font-weight: normal;
      margin-top: 0.2rem;
      opacity: 0.7;
      font-size: 0.9rem;

      @media screen and (max-width: $compact-breakpoint) {
        font-size: 0.85rem;
      }
    }
  }

  td.council-name {
    @media screen and (max-width: 528px) {
      font-size: 1.2rem;
    }
  }

  .bottom-row {
    color: inherit;
    background: transparent;
    font: inherit;
    width: 100%;
    border: $table-border;
    border-top: none;
    border-bottom-left-radius: 7px;
    border-bottom-right-radius: 7px;
    text-align: center;
    padding-top: 1rem;
    padding-bottom: 1rem;

    &.load-more-btn {
      cursor: pointer;
      background: hsl(0, 0%, 98%);

      &:hover {
        background: hsl(0, 0%, 97%);
      }

      &:active {
        background: hsl(0, 0%, 96%);
      }
    }

    &.no-postcodes-note {
      color: hsl(0, 0%, 50%);
      font-size: 0.9rem;
    }
  }
}
</style>
