<template>
  <div class="page-not-found">
    <h1>Page not found.</h1>
    <router-link to="/">Back to home</router-link>
  </div>
</template>

<script>
export default {
  created() {
    document.querySelector("head").innerHTML += `
      <meta name="robots" content="noindex" />
      <meta name="prerender-status-code" content="404" />
    `;
  }
};
</script>

<style lang="scss" scoped>
.page-not-found {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
</style>
