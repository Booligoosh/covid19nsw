<template>
  <div :class="{ 'is-above-data': isAboveData }">
    <p>
      This site uses official data provided by NSW Health, which is fetched
      fresh every time you load this page.
    </p>
    <p>
      You can view and download the raw data at
      <a href="https://data.nsw.gov.au/nsw-covid-19-data" target="_blank"
        >data.nsw.gov.au</a
      >.
    </p>
    <p>
      This site was built by
      <a href="https://twitter.com/Booligoosh" target="_blank">Ethan</a> and is
      not affiliated with the NSW government.
    </p>
  </div>
</template>

<script>
export default {
  props: {
    isAboveData: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style lang="scss" scoped>
.is-above-data:first-child > :first-child {
  margin-top: 0;
}
</style>
