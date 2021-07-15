<template>
  <div id="app">
    <div class="nav">
      <!-- Image source: https://commons.wikimedia.org/wiki/File:Virus_green.svg -->
      <div class="nav-logo">
        <div class="nav-logo-spacer left" />
        <img
          src="@/assets/logo.svg"
          class="nav-logo-img"
          title="COVID-19 NSW"
          width="450"
          height="450"
        />
        <div class="nav-logo-title">COVID-19 NSW</div>
        <div class="nav-logo-spacer right" />
        <router-link :to="{ name: 'AboutPage' }" class="nav-logo-about"
          >About this site</router-link
        >
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
import { DEFAULT_PAGE_TITLE, DEFAULT_PAGE_DESCRIPTION } from "@/constants";

export default {
  watch: {
    $route(to) {
      this.$store.state.pageTitle = to.meta.title || DEFAULT_PAGE_TITLE;
      this.$store.state.pageDescription =
        to.meta.description || DEFAULT_PAGE_DESCRIPTION;
    },
    "$store.state.pageTitle": function () {
      this.updatePageTitle();
    },
    "$store.state.pageDescription": function () {
      this.updatePageDescription();
    },
  },
  created() {
    if (window.location.origin === "https://covid19nsw.netlify.com") {
      window.location.href = window.location.href.replace(
        /^https:\/\/covid19nsw.netlify.com/,
        "https://covid19nsw.ethan.link"
      );
    }
    this.updatePageTitle();
    this.updatePageDescription();
  },
  methods: {
    updatePageTitle() {
      document.title = this.$store.state.pageTitle;
      document
        .querySelectorAll(".page-title-meta")
        .forEach((el) =>
          el.setAttribute("content", this.$store.state.pageTitle)
        );
    },
    updatePageDescription() {
      document
        .querySelectorAll(".page-description-meta")
        .forEach((el) =>
          el.setAttribute("content", this.$store.state.pageDescription)
        );
    },
  },
};
</script>

<style lang="scss">
@import url("https://rsms.me/inter/inter.css");
html {
  font-family: "Inter", sans-serif;
  font-feature-settings: "ss01";
}
@supports (font-variation-settings: normal) {
  html {
    font-family: "Inter var", sans-serif;
  }
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

  $about-width: 7rem;

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

      &-spacer {
        flex-grow: 1;

        &.left {
          margin-left: $about-width;

          @media screen and (max-width: 700px) {
            display: none;
          }
        }
      }
      &-img {
        width: auto;
        height: 2.5rem;
        vertical-align: middle;
        margin-right: 0.5rem;
      }
      &-title {
        font-weight: bold;
        display: flex;
        align-items: center;
      }
      &-about {
        font-weight: normal;
        font-size: 0.9rem;
        color: inherit;
        opacity: 0.6;
        width: $about-width;
        text-align: right;
        margin-left: auto;
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
    > :first-child,
    > :first-child > :first-child {
      margin-top: 0;
    }
  }
}

h1 {
  margin-top: 0;
}
</style>

<style lang="scss" scoped>
.beta {
  text-transform: uppercase;
  font-size: 0.7em;
  padding: 0.2rem 0.5rem;
  background: #ccc;
  border-radius: 5px;
  font-weight: 500;
  margin-left: 0.25rem;

  .bracket {
    display: none;
  }
}
</style>
