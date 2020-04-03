<template>
  <div class="home">
    <form @submit="formSubmitHandler">
      Choose your postcode:
      <input v-model="postcodeInputValue" placeholder="2000" />
      <button>Let's go</button>
    </form>
  </div>
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      postcodeInputValue: ""
    };
  },
  methods: {
    formSubmitHandler(event) {
      event.preventDefault();
      this.$router.push({
        name: "PostcodePage",
        params: { postcode: this.postcodeInputValue }
      });
    }
  }
};
</script>
