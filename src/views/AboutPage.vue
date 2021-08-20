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
        If you have any questions, feedback, or ideas (or job opportunities!),
        you can <a href="mailto:me@ethan.link">email me</a>.
      </p>
      <p class="bottom-note">
        <a href="https://github.com/Booligoosh/covid19nsw" target="_blank"
          >Source code on GitHub</a
        >
        (if you're a software dev)
      </p>
      <!-- <a
        class="tip-jar"
        href="https://www.buymeacoffee.com/booligoosh"
        target="_blank"
      >
        💵 Tip Jar
      </a> -->
    </div>
  </div>
</template>

<style lang="scss">
.about-page {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  h1 {
    font-size: 1.5rem;
  }

  .bottom-note {
    margin-top: 2rem;
    font-size: 0.8rem;
    opacity: 0.5;

    a {
      color: inherit;
    }
  }

  .tip-jar {
    display: block;
    padding: 0.6rem 2rem;
    border-radius: 10px;
    text-align: center;
    text-decoration: none;
    font-weight: 600;
    margin-top: 2rem;
    font-size: 0.9rem;
    width: max-content;
    // Colors from logo
    background: rgb(220, 237, 200);
    color: rgb(46, 125, 50);
  }
}
</style>
