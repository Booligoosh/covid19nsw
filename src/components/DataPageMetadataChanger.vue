<script>
export default {
  props: {
    totalCases: Number,
    councilName: String,
  },
  created() {
    if (this.$route.name === "CouncilPage") {
      this.$store.commit(
        "setPageTitle",
        `COVID-19 data for ${this.councilName}, NSW, Australia`
      );

      this.$store.commit(
        "setPageDescription",
        `As of ${this.$store.state.temporalCoverageTo.format(
          "D MMMM YYYY"
        )}, there are ${this.totalCases} cases of COVID-19 in ${
          this.councilName
        }. Click to see the latest data for your area.`
      );
    } else {
      this.$store.commit(
        "setPageTitle",
        `COVID-19 data for the postcode ${this.$route.params.postcode}, NSW, Australia`
      );

      this.$store.commit(
        "setPageDescription",
        `As of ${this.$store.state.temporalCoverageTo.format(
          "D MMMM YYYY"
        )}, there are ${this.totalCases} cases of COVID-19 in the postcode ${
          this.$route.params.postcode
        }. Click to see the latest data for your postcode.`
      );
    }
  },
};
</script>
