<template>
  <div :class="{ 'is-above-data': isAboveData }">
    <p>
      This site was built by
      <a href="https://ethan.link" target="_blank">Ethan</a> and is not
      affiliated with the NSW government.
    </p>
    <p>
      It uses the
      <a href="https://data.nsw.gov.au/nsw-covid-19-data" target="_blank"
        >official data</a
      >
      provided by NSW Health, which is fetched fresh every time you load this
      page.
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
