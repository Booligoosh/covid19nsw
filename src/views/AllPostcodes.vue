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
          <th scope="col" style="width: 6em">
            Postcode
          </th>
          <th scope="col" style="width: 7em">
            <sort-link name="totalCases">Total cases</sort-link>
          </th>
          <th scope="col" style="width: 12em">
            <sort-link name="newCasesThisWeek">New cases this week</sort-link>
          </th>
          <th scope="col" style="width: 10em">
            <sort-link name="newCasesToday">New cases today</sort-link>
          </th>
          <th scope="col">
            Suburb(s) in the postcode
          </th>
        </tr>
      </thead>
      <tbody slot="body" slot-scope="sort">
        <tr v-for="value in sort.values" :key="value.postcodeNumber">
          <td>{{ value.postcodeNumber }}</td>
          <td>{{ value.totalCases }}</td>
          <td>{{ value.newCasesThisWeek }}</td>
          <td>{{ value.newCasesToday }}</td>
          <td>
            <span class="suburbs-to-truncate">{{ value.suburbs }}</span>
            <!-- <a href="#" @click="suburbsSeeMoreClickHandler">Show more</a> -->
          </td>
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

  th {
    text-align: left;
  }

  td {
    // width: max-content;
    max-width: 0;

    &:not(.show-full) {
      .suburbs-to-truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        // width: 50vw;
        display: block;
      }
    }
  }
}
</style>
