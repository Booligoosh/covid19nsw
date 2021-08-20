<template>
  <div id="app">
    <div class="nav">
      <!-- Image source: https://commons.wikimedia.org/wiki/File:Virus_green.svg -->
      <div class="nav-logo">
        <div class="nav-logo-spacer left" />
        <img
          svg-inline
          src="@/assets/logo.svg"
          class="nav-logo-img"
          title="COVID-19 NSW"
          width="450"
          height="450"
        />
        <div class="nav-logo-title">COVID-19 NSW</div>
        <div class="nav-logo-spacer right" />
        <div class="nav-logo-links">
          <a href="https://www.buymeacoffee.com/booligoosh" target="_blank">
            Tip jar
          </a>
          <router-link :to="{ name: 'AboutPage' }">About site</router-link>
        </div>
      </div>
      <nav class="nav-links">
        <router-link :to="{ name: 'PostcodesPage' }">Postcodes</router-link>
        <router-link :to="{ name: 'CouncilsPage' }">Councils</router-link>
        <router-link :to="{ name: 'AlertsPage' }">
          Alerts
          <!-- <span class="beta"
          ><span class="bracket">(</span>beta<span class="bracket"
            >)</span
          ></span
        > -->
        </router-link>
      </nav>
    </div>
    <div class="page-wrapper">
      <router-view class="page" />
    </div>
  </div>
</template>

<script>
export default {
  created() {
    if (window.location.origin === "https://covid19nsw.netlify.com") {
      window.location.href = window.location.href.replace(
        /^https:\/\/covid19nsw.netlify.com/,
        "https://covid19nsw.ethan.link"
      );
    }
  },
};
</script>

<style lang="scss">
@font-face {
  font-family: "Inter var";
  font-weight: 100 900;
  font-display: optional;
  font-style: normal;
  font-named-instance: "Regular";
  src: url("/fonts/Inter-roman.var.woff2?v=3.19") format("woff2");
}
@font-face {
  font-family: "Inter var";
  font-weight: 100 900;
  font-display: optional;
  font-style: italic;
  font-named-instance: "Italic";
  src: url("/fonts/Inter-italic.var.woff2?v=3.19") format("woff2");
}

html {
  font-family: "Inter var", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  font-feature-settings: "ss01";
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

html,
body,
#app {
  height: 100%;
}

#app {
  display: flex;
  flex-direction: column;
  .page-wrapper {
    display: flex;
    flex-direction: column;
    // justify-content: center;
    flex-grow: 1;
  }

  .nav,
  .page {
    padding: 1.5rem;
    width: 1400px;
    max-width: 100%;
    margin: 0 auto;
  }
  .nav {
    padding-bottom: 0;

    &-logo {
      display: flex;
      justify-content: center;
      align-items: center;

      $logo-links-width: 9rem;

      &-spacer {
        flex-grow: 1;

        &.left {
          margin-left: $logo-links-width;

          @media screen and (max-width: 700px) {
            display: none;
          }
        }
      }
      &-img {
        width: auto;
        height: 2rem;
        margin-right: 0.25rem;

        @media screen and (max-width: 333px) {
          height: 1.5rem;
        }
      }
      &-title {
        font-weight: bold;
        display: flex;
        align-items: center;

        @media screen and (max-width: 333px) {
          font-size: 0.9rem;
        }
      }
      &-links {
        flex-shrink: 0;
        display: flex;
        justify-content: flex-end;
        width: $logo-links-width;

        @media screen and (max-width: 700px) {
          width: unset;
        }

        a {
          font-weight: normal;
          font-size: 0.85rem;
          color: inherit;
          opacity: 0.6;
          margin-left: 0.7rem;
        }
      }
    }

    &-links {
      // display: none;
      font-size: 0.9rem;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-gap: 0.5rem;
      width: max-content;
      margin: 0 auto;
      margin-top: 1rem;

      @media screen and (max-width: 700px) {
        width: 100%;
      }

      a {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        color: inherit;
        text-decoration: none;
        padding: 0.5rem 1rem;
        background: hsl(0, 0%, 97%);
        border-radius: 7px;
        border: 1px solid hsl(0, 0%, 80%);
        margin: 0 auto;
        font-size: 0.9rem;

        &:hover {
          background: hsl(0, 0%, 96%);
        }

        &.router-link-active {
          background: hsl(0, 0%, 92%);
        }
      }
    }
  }
  .page {
    flex-grow: 1;
    display: flex;
    flex-direction: column;

    &-loading,
    &-error {
      flex-grow: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
    &-error {
      color: red;
    }

    > :first-child,
    > :first-child > :first-child {
      margin-top: 0;
    }
  }
}

h1 {
  margin-top: 0;
}

button,
input {
  // Override default 2px margins in Safari
  margin: 0;
}
</style>
