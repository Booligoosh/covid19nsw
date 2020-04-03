<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view class="page" />
  </div>
</template>

<script>
export default {
  watch: {
    $route(to) {
      document.title = to.meta.title || "COVID-19 data for New South Wales";
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

html,
body,
#app {
  height: 100%;
}

#app {
  display: flex;
  flex-direction: column;

  #nav,
  .page {
    padding: 2rem;
    width: 1264px;
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
}

h1 {
  margin-top: 0;
}
</style>
