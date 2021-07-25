<template>
  <div class="all-page">
    <div class="chooser" v-if="!councilMode">
      <h2 class="chooser-title">See data for your postcode&hellip;</h2>
      <PostcodePicker @submit="postcodeSubmitHandler" />
    </div>
    <div class="page-error" v-if="$store.state.error">
      ⚠ {{ $store.state.error }}
    </div>
    <div
      class="page-loading"
      v-else-if="
        $store.state.cases.length === 0 || !$store.state.temporalCoverageTo
      "
    >
      Loading&hellip;
    </div>
    <div v-else>
      <h1 class="table-title">
        COVID-19 cases by {{ councilMode ? "council" : "postcode" }}
      </h1>
      <div class="table-subtitle">
        Data as of <mark>{{ lastUpdatedString }}</mark
        >, {{ councilMode ? "councils" : "postcodes" }} with 0 cases are not
        shown. <br />Click on {{ councilMode ? "councils" : "postcodes" }} for
        more stats, click on column headers to sort.
      </div>
      <table>
        <thead>
          <tr>
            <th>
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
            v-for="value in postcodeRowsSorted"
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
    </div>
  </div>
</template>

<script>
import suburbsForPostcode from "@/data/suburbsForPostcode.json";
import PostcodePicker from "../components/PostcodePicker.vue";

export default {
  components: { PostcodePicker },
  name: "ListPage",
  data() {
    return {
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
        ? this.$store.getters.councilNames.map((councilName) => ({
            councilName,
            col1Sort: councilName,
            councilSlug: councilName.replace(/ /g, "-").toLowerCase(),
            totalCases: totalCases[councilName] || 0,
            newCasesThisWeek: newCasesThisWeek[councilName] || 0,
            newCasesToday: newCasesToday[councilName] || 0,
          }))
        : this.$store.getters.postcodes.map((postcodeNumber) => ({
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
    lastUpdatedString() {
      return this.$store.state.temporalCoverageTo.format("D MMMM");
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

  br {
    @media screen and (max-width: 500px) {
      display: none;
    }
  }

  mark {
    font-weight: 500;
    background: hsl(0, 0%, 90%);
  }
}

$table-border: 1px solid hsl(0, 0%, 50%);
$table-border-radius: 7px;

table {
  width: 100%;
  margin: 0 auto;
  border-spacing: 0;

  @media screen and (max-width: $compact-breakpoint) {
    margin-left: -1.5rem;
    width: calc(100% + 3rem);
  }

  tbody tr {
    cursor: pointer;

    &:last-child {
      td {
        &:first-child {
          border-bottom-left-radius: $table-border-radius;
        }
        &:last-child {
          border-bottom-right-radius: $table-border-radius;
        }
      }
    }

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
      @media screen and (min-width: 590px) {
        width: 9rem;
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
  td {
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
}
</style>
