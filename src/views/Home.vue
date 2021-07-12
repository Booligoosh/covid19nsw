<template>
  <div class="home">
    <div>
      <h1>How is <i>your</i> suburb faring during the COVID-19 pandemic?</h1>
      <form @submit="formSubmitHandler">
        <div class="postcode-chooser">
          My postcode is
          <input
            v-model="postcodeInputValue"
            placeholder="2000"
            type="number"
            min="2000"
            max="2999"
            required
          />
          <button>Let&rsquo;s find out →</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      postcodeInputValue: "",
    };
  },
  methods: {
    formSubmitHandler(event) {
      event.preventDefault();
      this.$router.push({
        name: "PostcodePage",
        params: { postcode: this.postcodeInputValue },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-grow: 1;

  h1 {
    font-weight: 600;
  }
  .postcode-chooser {
    font-size: 1.5em;
    opacity: 0.9;

    input {
      font: inherit;
      color: inherit;
      background: transparent;
      padding: 0.25em;
      border: none;
      border-bottom: 2px solid #ccc;
      color: #777;

      &::placeholder {
        color: #ccc;
      }

      &:focus {
        outline: none;
        border-color: #aaa;
      }
    }

    button {
      font: inherit;
      color: inherit;
      border: none;
      background: #eee;
      font-size: 0.9em;
      padding: 0.5rem 1rem;
      border-radius: 5rem;
      float: right;
      cursor: pointer;

      &:hover,
      &:focus {
        background: #ddd;
        outline: none;
      }

      &:active {
        background: #ccc;
      }
    }
  }
}

@media screen and (max-width: 580px) {
  .home .postcode-chooser button {
    margin-top: 1.5rem;
    float: unset;
  }
}
</style>
