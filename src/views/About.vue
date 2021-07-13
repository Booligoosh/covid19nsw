<template>
  <div class="about-page">
    <a href="#" @click.prevent="$router.go(-1)" class="about-page-back">
      ← Back
    </a>
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

<style lang="scss" scoped>
.about-page {
  &-back {
    color: inherit;
    text-decoration: none;
    font-weight: bold;
  }
}
</style>
