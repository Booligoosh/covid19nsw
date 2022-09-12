<template>
  <div id="app">
    <div v-if="!$store.state.isEmbed" class="top-banner">
      In light of recent announcements, I'm unsure what the future of the
      postcodes dataset is. For now, Data NSW is updating it daily but with no
      new data - we'll see if new data comes in on Friday. I've also sent them
      an email to see what their plans are.
    </div>
    <div class="nav" v-if="!$store.state.isEmbed">
      <!-- Image source: https://commons.wikimedia.org/wiki/File:Virus_green.svg -->
      <div class="nav-top">
        <div class="nav-top-spacer left" />
        <router-link to="/" class="nav-top-logo">
          <img
            svg-inline
            src="@/assets/logo.svg"
            class="nav-top-logo-img"
            title="COVID-19 NSW"
            width="450"
            height="450"
          />
          <div class="nav-top-logo-title">COVID-19 NSW</div>
        </router-link>
        <div class="nav-top-spacer right" />
        <div class="nav-top-links">
          <a href="https://www.buymeacoffee.com/booligoosh" target="_blank">
            Tip jar
          </a>
          <router-link :to="{ name: 'AboutPage' }">About site</router-link>
        </div>
      </div>
      <nav class="nav-links">
        <router-link
          :to="{
            name:
              $route.name === 'CouncilPage' ||
              $route.name === 'CouncilsPage' ||
              $route.name === 'CouncilsVaccinationsPage'
                ? 'CouncilsPage'
                : 'PostcodesPage',
          }"
          :class="{
            active:
              $route.name === 'PostcodesPage' || $route.name === 'CouncilsPage',
          }"
        >
          Cases
        </router-link>
        <router-link
          :to="{
            name:
              $route.name === 'CouncilPage' ||
              $route.name === 'CouncilsPage' ||
              $route.name === 'CouncilsVaccinationsPage'
                ? 'CouncilsVaccinationsPage'
                : 'PostcodesVaccinationsPage',
          }"
          :class="{
            active:
              $route.name === 'PostcodesVaccinationsPage' ||
              $route.name === 'CouncilsVaccinationsPage',
          }"
        >
          Vaccinations
        </router-link>
      </nav>
      <GlobalChooser v-if="$route.meta.showSearch" />
      <a
        class="nav-back-btn"
        v-if="$route.name === 'PostcodePage' || $route.name === 'CouncilPage'"
        @click="
          $store.getters.canGoBack
            ? $router.go(-1)
            : $router.push({
                name:
                  $route.name === 'CouncilPage'
                    ? 'CouncilsPage'
                    : 'PostcodesPage',
              })
        "
      >
        ← Go back
      </a>
    </div>
    <div class="page-wrapper">
      <router-view class="page" />
    </div>
  </div>
</template>

<script>
import GlobalChooser from "./components/GlobalChooser.vue";
export default {
  components: { GlobalChooser },
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
    // NOTE: If changing $nav-breakpoint,
    // change in GlobalChooser.vue as well
    $nav-breakpoint: 700px;

    &-top {
      display: flex;
      justify-content: center;
      align-items: center;

      $small-logo-title-breakpoint: 333px;
      $top-links-width: 9rem;

      &-spacer {
        flex-grow: 1;

        &.left {
          margin-left: $top-links-width;

          @media screen and (max-width: $nav-breakpoint) {
            display: none;
          }
        }
      }
      &-logo {
        display: flex;
        align-items: center;
        color: inherit;
        text-decoration: none;

        &-img {
          width: auto;
          height: 2rem;
          margin-right: 0.25rem;

          @media screen and (max-width: $small-logo-title-breakpoint) {
            height: 1.5rem;
          }
        }
        &-title {
          font-weight: bold;
          display: flex;
          align-items: center;

          @media screen and (max-width: $small-logo-title-breakpoint) {
            font-size: 0.9rem;
          }
        }
      }
      &-links {
        flex-shrink: 0;
        display: flex;
        justify-content: flex-end;
        width: $top-links-width;

        @media screen and (max-width: $nav-breakpoint) {
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
      grid-template-columns: 1fr 1fr;
      grid-gap: 0.5rem;
      width: max-content;
      margin: 0 auto;
      margin-top: 1rem;

      @media screen and (max-width: $nav-breakpoint) {
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

        &.active {
          background: hsl(0, 0%, 92%);
        }
      }
    }

    &-back-btn {
      display: block;
      width: max-content;
      color: inherit;
      opacity: 0.5;
      font-size: 0.9rem;
      margin-top: 0.5rem;
      cursor: pointer;
      text-decoration: underline;
    }
  }
  .page {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    padding-top: 1rem;

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

.top-banner {
  background: #eee;
  padding: 1rem 1.5rem;
  font-size: 0.8rem;
  display: flex;
  justify-content: center;
}
</style>
