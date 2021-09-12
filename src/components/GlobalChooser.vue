<template>
  <div class="chooser">
    <h2 class="chooser-title">See data for your area&hellip;</h2>
    <PostcodePicker
      :usePostcodes="true"
      :useCouncils="true"
      @submit="postcodeSubmitHandler"
    />
  </div>
</template>

<script>
import PostcodePicker from "./PostcodePicker.vue";
export default {
  components: { PostcodePicker },
  name: "GlobalChooser",
  methods: {
    postcodeSubmitHandler({ type, value }) {
      switch (type) {
        case 1:
          this.$router.push({
            name: "PostcodePage",
            params: { postcode: value },
          });
          break;
        case 2:
          this.$router.push({
            name: "CouncilPage",
            params: { councilSlug: value.replace(/ /g, "-").toLowerCase() },
          });
          break;
      }
    },
  },
};
</script>

<style lang="scss">
// NOTE: If changing $chooser-compact-breakpoint,
// change in ListPage.vue as well
$chooser-compact-breakpoint: 460px;

.chooser {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  max-width: calc(948px - 3rem);
  margin: 0 auto;
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid hsl(0, 0%, 80%);
  border-radius: 7px;

  @media screen and (max-width: $chooser-compact-breakpoint) {
    border: none;
    padding: 0;
    margin-top: 0.5rem;

    .postcode-picker {
      width: 100%;
    }
  }

  &-title {
    margin: 0;
    font-weight: 500;
    text-align: center;
    font-size: 1.3rem;

    @media screen and (max-width: $chooser-compact-breakpoint) {
      display: none;
    }
  }
}
</style>
