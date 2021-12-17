<template>
  <div class="case-locations-page">
    <p>
      <b>
        Unfortunately, case location alerts are no longer published by the NSW
        Government.
      </b>
      <br />
      <br />
      The rest of this site will continue to function though! You can
      <a
        href="https://www.nsw.gov.au/covid-19/stay-safe/case-locations/exposure-sites"
        target="_blank"
        >learn more about the NSW Government's decision</a
      >.
      <br />
      <br />
      <br />
      <router-link to="/">← Back to home page</router-link>
    </p>
  </div>
</template>

<script>
export default {
  name: "AlertsPage",
};
</script>

<style lang="scss">
.case-locations-page {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
