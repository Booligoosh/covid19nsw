<template>
  <div class="about-page">
    <div>
      <h1>About this site</h1>
      <p>
        This site uses the latest official COVID-19 data provided by NSW Health.
      </p>
      <p>
        It’s built and maintained by
        <a href="https://ethan.link" target="_blank">Ethan</a> and is not
        affiliated with the NSW government.
      </p>
      <p>
        If you have any questions, feedback, or ideas, you can
        <a href="mailto:me@ethan.link">email me</a>.
      </p>
      <h2>Data sources</h2>
      <ul>
        <li>
          <a
            href="https://data.nsw.gov.au/nsw-covid-19-data/cases"
            target="_blank"
          >
            NSW COVID-19 cases by location
          </a>
        </li>
        <li>
          <a
            href="https://data.nsw.gov.au/nsw-covid-19-data/case-locations"
            target="_blank"
          >
            NSW COVID-19 case locations
          </a>
        </li>
        <li>
          <a
            href="https://www.nsw.gov.au/covid-19/stay-safe/data-and-statistics#toc-map-of-nsw-vaccinations-by-home-postcode-and-lga"
            target="_blank"
          >
            Map of NSW vaccinations by home postcode and LGA
          </a>
        </li>
        <li>
          <a
            href="https://www.health.gov.au/resources/collections/covid-19-vaccination-geographic-vaccination-rates-lga"
            target="_blank"
          >
            COVID-19 vaccination rates by LGA
          </a>
        </li>
        <li>
          <a
            href="https://www.health.gov.au/resources/collections/covid-19-vaccine-rollout-updates"
            target="_blank"
          >
            COVID-19 vaccine rollout updates</a
          >
          (<a
            href="https://github.com/jxeeno/aust-govt-covid19-vaccine-pdf"
            target="_blank"
            >extracted by Ken Tsang</a
          >)
        </li>
        <li>
          <a
            href="https://www.abs.gov.au/statistics/people/population/regional-population-age-and-sex/2020"
            target="_blank"
          >
            ABS 2020 Regional population by age and sex
          </a>
        </li>
        <li>
          <a
            href="https://datapacks.censusdata.abs.gov.au/datapacks/"
            target="_blank"
          >
            ABS 2016 Census data
          </a>
        </li>
      </ul>
      <p class="bottom-note">
        <a href="https://github.com/Booligoosh/covid19nsw" target="_blank">
          Source code on GitHub
        </a>
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

  h2 {
    font-size: 1.17rem;
    margin-bottom: 0.5rem;
  }

  ul {
    margin: 0;

    li {
      margin: 0.5rem 0;
    }
  }

  .bottom-note {
    margin-top: 1.5rem;
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
