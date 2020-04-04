<template>
  <div id="app">
    <!-- Dynamic metadata -->
    <title>{{ $store.state.pageTitle }}</title>
    <meta name="twitter:title" :content="$store.state.pageTitle" />
    <meta property="og:title" :content="$store.state.pageTitle" />
    <meta name="description" :content="$store.state.pageDescription" />
    <meta name="twitter:description" :content="$store.state.pageDescription" />
    <meta property="og:description" :content="$store.state.pageDescription" />
    <!-- End dynamic metadata -->
    <div id="nav" v-if="$route.name !== 'Home'">
      <router-link to="/">Home</router-link>
      <!-- | <router-link to="/about">About</router-link> -->
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
    }
  },
  created() {
    if (window.location.origin === "https://covid19nsw.netlify.com") {
      window.location.href = window.location.href.replace(
        /^https:\/\/covid19nsw.netlify.com/,
        "https://covid19nsw.ethan.link"
      );
    }
  }
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

  #nav,
  .page {
    padding: calc(2rem + 8px);
    width: 1400px;
    max-width: 100%;
    margin: 0 auto;
  }
  #nav {
    padding-bottom: 0;
    a {
      font-weight: bold;
      color: #2c3e50;
      opacity: 0.75;

      &.router-link-exact-active {
        opacity: 1;
      }
      text-decoration: none;
    }
  }
  .page {
    padding-top: 2rem;
  }
}

h1 {
  margin-top: 0;
}
</style>
