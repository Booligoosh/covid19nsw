<template>
  <div class="about-page">
    <div>
      <h1>About this site</h1>
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
  </div>
</template>

<style lang="scss" scoped>
.about-page {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;

  h1 {
    font-size: 1.5rem;
  }
}
</style>
