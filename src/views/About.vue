<template>
  <div class="about-page">
    <a href="#" @click.prevent="$router.go(-1)" class="about-page-back">
      ← Back
    </a>
    <ExplainerText :unstyled="true" />
  </div>
</template>

<script>
import ExplainerText from "../components/ExplainerText.vue";

export default {
  components: { ExplainerText },
};
</script>

<style lang="scss" scoped>
.about-page {
  &-back {
    color: inherit;
    text-decoration: none;
    font-weight: bold;
  }
}
</style>
