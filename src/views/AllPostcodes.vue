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
    <sorted-table :values="postcodeRows" sort="totalCases" dir="desc">
      <thead>
        <tr>
          <th scope="col">
            Postcode
          </th>
          <th scope="col" style="width: 9rem">
            <sort-link name="totalCases">Total cases</sort-link>
          </th>
          <th scope="col" style="width: 14rem">
            <sort-link name="newCasesThisWeek">New cases this week</sort-link>
          </th>
          <th scope="col" style="width: 12rem">
            <sort-link name="newCasesToday">New cases today</sort-link>
          </th>
          <th scope="col">
            Suburb(s) in the postcode
          </th>
        </tr>
      </thead>
      <tbody slot="body" slot-scope="sort">
        <tr v-for="value in sort.values" :key="value.postcodeNumber">
          <td class="postcode-number">{{ value.postcodeNumber }}</td>
          <td class="value-number">{{ value.totalCases }}</td>
          <td class="value-number">{{ value.newCasesThisWeek }}</td>
          <td class="value-number">{{ value.newCasesToday }}</td>
          <td>{{ value.suburbs }}</td>
        </tr>
      </tbody>
    </sorted-table>
  </div>
</template>

<script>
// import dayjs from "dayjs";

import suburbsForPostcode from "@/data/suburbsForPostcode.json";

export default {
  name: "AllPostcodes",
  computed: {
    postcodeRows() {
      const oneWeekAgo = this.$store.state.temporalCoverageTo.subtract(
        7,
        "days"
      );
      return this.$store.getters.postcodes.map(postcodeNumber => {
        const allCases = this.$store.state.cases.filter(
          ({ postcode }) => postcode === postcodeNumber
        );
        const newCasesThisWeek = allCases.filter(({ date }) =>
          date.isAfter(oneWeekAgo)
        ).length;
        const newCasesToday = allCases.filter(({ date }) =>
          date.isSame(this.$store.state.temporalCoverageTo)
        ).length;

        return {
          postcodeNumber,
          totalCases: allCases.length,
          newCasesThisWeek,
          newCasesToday,
          suburbs: suburbsForPostcode[postcodeNumber].join(", ")
        };
      });
    }
  },
  methods: {
    suburbsSeeMoreClickHandler(event) {
      event.preventDefault();
      event.target.parentElement.classList.add("show-full");
    }
  }
};
</script>

<style lang="scss" scoped>
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

table {
  max-width: 100%;
  width: 100%;
  border-top: 1px solid;
  border-left: 1px solid;
  border-spacing: 0;

  th {
    text-align: left;
    position: sticky;
    top: 0;
    background: #eee;
  }

  th,
  td {
    border-right: 1px solid;
    border-bottom: 1px solid;
    padding: 0.5rem 1rem;
  }

  th a {
    color: inherit;
    text-decoration: none;
    border-bottom: 2px solid;
    padding: 1px 0;
  }

  td.value-number,
  td.postcode-number {
    font-size: 1.5em;
    font-weight: 500;
  }

  td.postcode-number {
    font-weight: 800;
  }
}
</style>
