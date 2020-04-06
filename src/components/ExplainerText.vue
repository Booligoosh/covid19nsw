<template>
  <div>
    <p>
      The data {{ isAboveData ? "below" : "above" }} is official data provided
      by the NSW Ministry of Health, and is fetched fresh every time you load
      this page.
    </p>
    <p>
      You can view and download the raw data from the NSW Ministry of Health at
      <a
        href="https://data.nsw.gov.au/data/dataset/covid-19-cases-by-location"
        target="_blank"
        >data.nsw.gov.au</a
      >.
    </p>
    <p>
      This site was built by
      <a href="https://twitter.com/Booligoosh" target="_blank">Ethan</a>, and is
      not affiliated with the NSW government in any way.
    </p>
  </div>
</template>

<script>
export default {
  props: {
    isAboveData: {
      type: Boolean,
      default: false
    }
  }
};
</script>
