<template>
  <div id="app">
    <div class="nav">
      <!-- Image source: https://commons.wikimedia.org/wiki/File:Virus_green.svg -->
      <img src="@/assets/logo.svg" class="nav-logo" title="COVID19NSW" />
      <div>
        <div class="nav-title">COVID19NSW</div>
        <nav class="nav-links">
          <router-link :to="{ name: 'AllPostcodes' }">Postcodes</router-link>
          &bull;
          <router-link to="/locations">
            Case locations
            <!-- <span class="beta"
          ><span class="bracket">(</span>beta<span class="bracket"
            >)</span
          ></span
        > -->
          </router-link>
          <!-- | <router-link to="/about">About</router-link> -->
        </nav>
      </div>
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

  .nav,
  .page {
    padding: 1.5rem;
    width: 1400px;
    max-width: 100%;
    margin: 0 auto;
  }
  .nav {
    padding-bottom: 0;
    display: flex;
    align-items: center;

    &-logo {
      height: 2.5rem;
      vertical-align: middle;
      margin-right: 0px;
      margin-right: 0.5rem;
    }

    &-title {
      font-weight: bold;
    }

    &-links {
      // display: none;
      font-size: 0.9rem;
    }

    a {
      // font-weight: bold;
      color: #2c3e50;
      opacity: 0.75;

      &.router-link-exact-active {
        opacity: 1;
      }
      text-decoration: none;
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
