<template>
  <div class="case-locations-page">
    <p>
      <b>
        Unfortunately, case location alerts are no longer published by the NSW
        Government.
      </b>
      <br />
      <br />
      The rest of this site will continue to function though!
      <br />
      <br />
      <a
        href="https://www.nsw.gov.au/covid-19/stay-safe/case-locations/exposure-sites"
        target="_blank"
        >Learn more about the NSW Government's decision here.</a
      >
      <br />
      <br />
      I'll remove this particular page completely in a week or two.
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

  h1 {
    font-size: 1.5rem;
  }

  h2 {
    font-size: 1.17rem;
    margin-bottom: 0.5rem;
  }
}
</style>
