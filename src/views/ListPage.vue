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
    <div class="chooser" v-if="!councilMode">
      <h2 class="chooser-title">See data for your postcode&hellip;</h2>
      <form @submit.prevent="formSubmitHandler" class="chooser-form">
        <input
          v-model="postcodeInputValue"
          placeholder="2000"
          type="number"
          min="2000"
          max="2999"
          autofocus
          required
        />
        <button>Go →</button>
      </form>
    </div>
    <h1 class="table-title">
      COVID-19 cases by {{ councilMode ? "council" : "postcode" }}
    </h1>
    <div class="table-subtitle">
      Data as of <mark>{{ lastUpdatedString }}</mark
      >. {{ councilMode ? "Councils" : "Postcodes" }} with 0 cases are not
      shown.
    </div>
    <sorted-table :values="postcodeRows" sort="newCasesThisWeek" dir="desc">
      <thead>
        <tr>
          <th scope="col">
            <sort-link
              v-if="councilMode"
              name="councilName"
              title="Sort by Council/LGA"
            >
              Council/LGA
            </sort-link>
            <sort-link v-else name="postcodeNumberNeg" title="Sort by Postcode">
              Postcode
            </sort-link>
          </th>
          <th scope="col" style="width: 9rem">
            <sort-link name="newCasesToday" title="Sort by Cases today">
              Today
            </sort-link>
          </th>
          <th scope="col" style="width: 9rem">
            <sort-link name="newCasesThisWeek" title="Sort by Cases this week">
              This week
            </sort-link>
          </th>
          <th scope="col" style="width: 9rem">
            <sort-link name="totalCases" title="Sort by Total cases">
              Total
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
            >
            <div class="suburbs">{{ value.suburbs }}</div>
          </td>
          <td class="value-number">{{ value.newCasesToday }}</td>
          <td class="value-number">{{ value.newCasesThisWeek }}</td>
          <td class="value-number">{{ value.totalCases }}</td>
        </tr>
      </tbody>
    </sorted-table>
  </div>
</template>

<script>
import suburbsForPostcode from "@/data/suburbsForPostcode.json";

export default {
  name: "ListPage",
  data() {
    return {
      postcodeInputValue: "",
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
      if (this.councilMode) {
        return this.$store.getters.councilNames.map((councilName) => ({
          councilName,
          councilSlug: councilName.replace(/ /g, "-").toLowerCase(),
          totalCases: totalCases[councilName] || 0,
          newCasesThisWeek: newCasesThisWeek[councilName] || 0,
          newCasesToday: newCasesToday[councilName] || 0,
        }));
      } else {
        return this.$store.getters.postcodes.map((postcodeNumber) => ({
          postcodeNumber,
          // Negative version of postcode so default desc cases sort === asc postcodes sort
          postcodeNumberNeg: postcodeNumber * -1,
          totalCases: totalCases[postcodeNumber] || 0,
          newCasesThisWeek: newCasesThisWeek[postcodeNumber] || 0,
          newCasesToday: newCasesToday[postcodeNumber] || 0,
          suburbs: suburbsForPostcode[postcodeNumber].join(", "),
        }));
      }
    },
    lastUpdatedString() {
      return this.$store.state.temporalCoverageTo.format("D MMMM");
    },
  },
  methods: {
    formSubmitHandler() {
      this.$router.push({
        name: "PostcodePage",
        params: { postcode: this.postcodeInputValue },
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

  &-form {
    opacity: 0.9;
    display: flex;
    justify-content: center;
    max-width: 100%;

    input {
      font: inherit;
      color: inherit;
      background: transparent;
      padding: 0.25em;
      border: 1px solid hsl(0, 0%, 70%);
      border-right: none;
      border-radius: 10px 0 0 10px;
      min-width: 4em;
      width: 257px; // Firefox default

      // Hide number input arrows, see:
      // https://www.w3schools.com/howto/howto_css_hide_arrow_number.asp
      -moz-appearance: textfield; // For Firefox
      // For Chrome, Safari, Edge, Opera:
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      &::placeholder {
        color: hsl(0, 0%, 70%);
        opacity: 1;
      }

      &:focus {
        outline: none;
        border-color: #aaa;
      }
    }

    button {
      font: inherit;
      color: inherit;
      border: none;
      background: #eee;
      font-size: 0.9em;
      padding: 0.5rem 1rem;
      border-radius: 5rem;
      cursor: pointer;
      border: 1px solid hsl(0, 0%, 70%);
      border-radius: 0 10px 10px 0;
      flex-shrink: 0;

      &:hover,
      &:focus {
        background: #ddd;
        outline: none;
      }

      &:active {
        background: #ccc;
      }
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

$table-border-color: hsl(0, 0%, 50%);

table {
  width: 100%;
  margin: 0 auto;
  border: 1px solid $table-border-color;
  border-spacing: 0;
  border-radius: 7px;
  overflow: hidden;

  @media screen and (max-width: $compact-breakpoint) {
    margin-left: -1.5rem;
    width: calc(100% + 3rem);
    border-radius: 0;
    border-left: none;
    border-right: none;
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
    background: hsl(0, 0%, 95%);
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
    padding: 0.5rem 1rem;

    &:not(:last-child) {
      border-right: 1px solid $table-border-color;
    }

    @media screen and (max-width: $compact-breakpoint) {
      padding: 0.4rem;
    }
  }

  thead tr,
  tbody tr:not(:last-child) {
    th,
    td {
      border-bottom: 1px solid $table-border-color;
    }
  }

  td.value-number,
  td.postcode-number,
  td.council-name {
    font-size: 1.5em;
    font-weight: 500;
  }

  td.postcode-number,
  td.council-name {
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

  td.council-name {
    @media screen and (max-width: 528px) {
      font-size: 1.2rem;
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
