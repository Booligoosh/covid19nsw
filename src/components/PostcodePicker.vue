<template>
  <form @submit.prevent="formSubmitHandler" class="postcode-picker">
    <input
      v-model="inputValue"
      placeholder="Enter postcode (eg. 2000)"
      type="number"
      min="2000"
      max="2999"
      :autofocus="autofocus"
      required
      :class="{ fullwidth }"
    />
    <button>Go →</button>
  </form>
</template>

<script>
export default {
  name: "PostcodePicker",
  props: {
    value: {
      type: String,
      required: false,
      default: "",
    },
    autofocus: {
      type: Boolean,
      required: false,
      default: true,
    },
    fullwidth: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      inputValue: this.value,
    };
  },
  methods: {
    formSubmitHandler() {
      this.$emit("submit", this.inputValue);
    },
  },
};
</script>

<style lang="scss">
.postcode-picker {
  opacity: 0.9;
  display: flex;
  max-width: 100%;

  input {
    font: inherit;
    color: inherit;
    background: transparent;
    padding: 0.25em;
    border: 1px solid hsl(0, 0%, 70%);
    border-right: none;
    border-radius: 10px 0 0 10px;
    min-width: 4em;
    width: 257px; // Firefox default
    flex-grow: 1;
    &.fullwidth {
      width: 100%;
    }

    // Hide number input arrows, see:
    // https://www.w3schools.com/howto/howto_css_hide_arrow_number.asp
    -moz-appearance: textfield; // For Firefox
    // For Chrome, Safari, Edge, Opera:
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &::placeholder {
      color: hsl(0, 0%, 70%);
      opacity: 1;
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
    cursor: pointer;
    border: 1px solid hsl(0, 0%, 70%);
    border-radius: 0 10px 10px 0;
    flex-shrink: 0;

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
</style>
