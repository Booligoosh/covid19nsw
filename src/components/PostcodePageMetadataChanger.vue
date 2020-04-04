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
    }. Click to see how this number has changed over time, as well as new cases per day.`;
  }
};
</script>
