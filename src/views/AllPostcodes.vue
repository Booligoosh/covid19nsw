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
          <th scope="col" style="text-align: left; width: 10rem;">
            <sort-link name="postcodeNumber">Postcode</sort-link>
          </th>
          <th scope="col" style="text-align: left; width: 10rem;">
            <sort-link name="suburbs">Suburb(s)</sort-link>
          </th>
          <th scope="col" style="text-align: left; width: 10rem;">
            <sort-link name="totalCases">Total cases</sort-link>
          </th>
        </tr>
      </thead>
      <tbody slot="body" slot-scope="sort">
        <tr v-for="value in sort.values" :key="value.postcodeNumber">
          <td>{{ value.postcodeNumber }}</td>
          <td>{{ value.suburbs }}</td>
          <td>{{ value.totalCases }}</td>
        </tr>
      </tbody>
    </sorted-table>
  </div>
</template>

<script>
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);

export default {
  name: "AllPostcodes",
  computed: {
    postcodeRows() {
      return this.$store.getters.postcodes.map(postcodeNumber => ({
        postcodeNumber,
        totalCases: this.$store.state.cases.filter(
          ({ postcode }) => postcode === postcodeNumber
        ).length,
        suburbs: "" // Todo
      }));
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
</style>
