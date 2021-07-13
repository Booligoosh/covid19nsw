<template>
  <div class="all-page-error" v-if="$store.state.error">
    ⚠ {{ $store.state.error }}
  </div>
  <div
    class="all-page-loading"
    v-else-if="
      $store.state.cases.length === 0 || !$store.state.temporalCoverageTo
    "
  >
    Loading&hellip;
  </div>
  <div class="all-page" v-else>
    <ExplainerText />
    <h1 class="table-title">COVID-19 cases by postcode</h1>
    <div class="table-subtitle">
      Data as of {{ lastUpdatedString }}. Postcodes with 0 cases are not shown.
    </div>
    <sorted-table :values="postcodeRows" sort="newCasesThisWeek" dir="desc">
      <thead>
        <tr>
          <th scope="col">
            <sort-link name="postcodeNumberNeg" title="Sort by Postcode">
              Postcode
            </sort-link>
          </th>
          <th scope="col" style="width: 9rem">
            <sort-link name="totalCases" title="Sort by Total cases">
              Total
            </sort-link>
          </th>
          <th scope="col" style="width: 9rem">
            <sort-link name="newCasesThisWeek" title="Sort by Cases this week">
              This week
            </sort-link>
          </th>
          <th scope="col" style="width: 9rem">
            <sort-link name="newCasesToday" title="Sort by Cases today">
              Today
            </sort-link>
          </th>
        </tr>
      </thead>
      <tbody slot="body" slot-scope="sort">
        <tr
          v-for="value in sort.values"
          :key="value.postcodeNumber"
          role="button"
          @click="
            $router.push({
              name: 'PostcodePage',
              params: { postcode: value.postcodeNumber },
            })
          "
        >
          <td class="postcode-number">
            <router-link
              :to="{
                name: 'PostcodePage',
                params: { postcode: value.postcodeNumber },
              }"
              >{{ value.postcodeNumber }}</router-link
            >
            <div class="suburbs">{{ value.suburbs }}</div>
          </td>
          <td class="value-number">{{ value.totalCases }}</td>
          <td class="value-number">{{ value.newCasesThisWeek }}</td>
          <td class="value-number">{{ value.newCasesToday }}</td>
        </tr>
      </tbody>
    </sorted-table>
  </div>
</template>

<script>
import ExplainerText from "@/components/ExplainerText.vue";
import suburbsForPostcode from "@/data/suburbsForPostcode.json";

export default {
  name: "AllPostcodes",
  components: {
    ExplainerText,
  },
  computed: {
    postcodeRows() {
      // Initialise objects
      const totalCases = {};
      const newCasesThisWeek = {};
      const newCasesToday = {};

      // Calculate dates to compare to
      const today = this.$store.state.temporalCoverageTo.format("YYYY-MM-DD");
      const oneWeekAgo = this.$store.state.temporalCoverageTo
        .subtract(7, "days")
        .format("YYYY-MM-DD");

      // Iterate through each case
      this.$store.state.cases.forEach(({ postcode, rawDate }) => {
        // Add the case to its postcode's total cases
        totalCases[postcode] = (totalCases[postcode] || 0) + 1;
        // If the case is today, add it to its postcode's cases today & this week
        if (rawDate === today) {
          newCasesToday[postcode] = (newCasesToday[postcode] || 0) + 1;
          newCasesThisWeek[postcode] = (newCasesThisWeek[postcode] || 0) + 1;
        }
        // Otherwise if the case is this week, add it to its postcode's casesthis week
        else if (rawDate > oneWeekAgo) {
          newCasesThisWeek[postcode] = (newCasesThisWeek[postcode] || 0) + 1;
        }
      });

      // Return postcodes using precalculated values
      return this.$store.getters.postcodes.map((postcodeNumber) => ({
        postcodeNumber,
        // Negative version of postcode so default desc cases sort === asc postcodes sort
        postcodeNumberNeg: postcodeNumber * -1,
        totalCases: totalCases[postcodeNumber] || 0,
        newCasesThisWeek: newCasesThisWeek[postcodeNumber] || 0,
        newCasesToday: newCasesToday[postcodeNumber] || 0,
        suburbs: suburbsForPostcode[postcodeNumber].join(", "),
      }));
    },
    lastUpdatedString() {
      return this.$store.state.temporalCoverageTo.format("D MMMM");
    },
  },
  methods: {
    suburbsSeeMoreClickHandler(event) {
      event.preventDefault();
      event.target.parentElement.classList.add("show-full");
    },
  },
};
</script>

<style lang="scss" scoped>
$compact-breakpoint: 492px;

.all-page {
  width: 948px !important;
}

.all-page-loading,
.all-page-error {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.all-page-error {
  color: red;
}

.last-updated-text {
  float: right;
  opacity: 0.6;

  .full-stop {
    display: none;
  }
}

@media screen and (max-width: 595px) {
  .last-updated-text {
    float: unset;
    // opacity: 1;

    .full-stop {
      display: inline;
    }
  }
}

$table-title-breakpoint: 460px;
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
}

table {
  width: 100%;
  margin: 0 auto;
  border-top: 1px solid;
  border-left: 1px solid;
  border-spacing: 0;

  @media screen and (max-width: $compact-breakpoint) {
    margin-left: -1.5rem;
    width: calc(100% + 3rem);
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

  th {
    text-align: left;
    position: sticky;
    top: 0;
    background: #eee;
    z-index: 1;

    a {
      color: inherit;
      text-decoration: none;
      padding: 1px 0;

      // Use a grid layout so the space for the sort arrow is preserved even when
      // it's not there, preventing columns resizing when sorting is changed.
      display: grid;
      // 13px for size of sort arrow
      grid-template-columns: auto 13px;
      justify-content: space-between;
      align-items: center;
    }
  }

  th,
  td {
    border-right: 1px solid;
    border-bottom: 1px solid;
    padding: 0.5rem 1rem;

    @media screen and (max-width: $compact-breakpoint) {
      padding: 0.4rem;
    }
  }

  td.value-number,
  td.postcode-number {
    font-size: 1.5em;
    font-weight: 500;
  }

  td.postcode-number {
    font-weight: 800;

    a {
      color: inherit;
      text-decoration: none;
    }

    .suburbs {
      font-weight: normal;
      margin-top: 0.2rem;
      opacity: 0.7;
      font-size: 0.9rem;
    }
  }
}
</style>

<style lang="scss">
// Must be outside of scoped styles as the span is
// within the table component rather than this one.
table.table th a > span {
  font-size: 0.75em;
}
</style>
