<template>
  <div>
    <div :class="{ 'explainer-text': !unstyled }">
      <p>
        This site was built by
        <a href="https://ethan.link" target="_blank">Ethan</a> and is not
        affiliated with the NSW government.
      </p>
      <p>
        It uses the
        <a href="https://data.nsw.gov.au/nsw-covid-19-data" target="_blank"
          >official data</a
        >
        provided by NSW Health, which is fetched fresh every time you load this
        page.
      </p>
    </div>

    <router-link :to="{ name: 'About' }" class="about-link" v-if="!unstyled">
      About this site →
    </router-link>
  </div>
</template>

<script>
export default {
  props: {
    unstyled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
};
</script>

<style lang="scss" scoped>
.explainer-text,
.about-link {
  color: inherit;
  text-decoration: none;

  display: block;
  padding: 1rem;
  background: hsl(0, 0%, 97%);
  border-radius: 7px;
  border: 1px solid hsl(0, 0%, 80%);
  margin: 0 auto;
  font-size: 0.9rem;

  :first-child {
    margin-top: 0;
  }
  :last-child {
    margin-bottom: 0;
  }
}

$breakpoint: 560px;
@media screen and (max-width: $breakpoint) {
  .explainer-text {
    display: none;
  }
}
@media screen and (min-width: $breakpoint + 1px) {
  .about-link {
    display: none;
  }
}
</style>
