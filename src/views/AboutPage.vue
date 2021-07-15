<template>
  <div class="about-page">
    <div>
      <h1>About this site</h1>
      <p>
        This site uses the latest
        <a href="https://data.nsw.gov.au/nsw-covid-19-data" target="_blank"
          >official COVID-19 data</a
        >
        provided by NSW Health.
      </p>
      <p>
        It’s built and maintained by
        <a href="https://ethan.link" target="_blank">Ethan</a> and is not
        affiliated with the NSW government.
      </p>
      <p>
        It&rsquo;s also open source &mdash; you can see the source code
        <a href="https://github.com/Booligoosh/covid19nsw" target="_blank">
          on GitHub.
        </a>
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

  h1 {
    font-size: 1.5rem;
  }
}
</style>
