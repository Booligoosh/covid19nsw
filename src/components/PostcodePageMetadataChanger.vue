<script>
export default {
  props: {
    totalCases: Number
  },
  created() {
    this.$store.state.pageTitle = `COVID-19 data for the postcode ${this.$route.params.postcode}, NSW, Australia`;

    this.$store.state.pageDescription = `As of ${this.$store.state.temporalCoverageTo.format(
      "D MMMM YYYY"
    )}, there are ${this.totalCases} cases of COVID-19 in the postcode ${
      this.$route.params.postcode
    }. Click to see the latest data for your postcode, and view graphs of how it has changed over time.`;
  }
};
</script>
