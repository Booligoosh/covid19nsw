<template>
  <form
    @submit.prevent="formSubmitHandler"
    :class="{ 'postcode-picker': true, 'has-results': shouldShowResults }"
  >
    <input
      v-model="inputValue"
      :placeholder="`Enter postcode${usePostcodes ? '/suburb' : ''}${
        useCouncils ? '/council' : ''
      }`"
      type="text"
      spellcheck="false"
      :autofocus="autofocus"
      required
      :class="{ 'postcode-picker-input': true, fullwidth }"
      @keydown="keydownHandler"
      @focus="setInputFocused(true)"
      @blur="setInputFocused(false)"
    />
    <button class="postcode-picker-button">Go →</button>
    <div class="postcode-picker-results" v-if="shouldShowResults">
      <button
        type="button"
        v-for="(result, index) of results.slice(0, RESULTS_LIMIT)"
        :class="{
          'postcode-picker-results-result': true,
          focused: focusedResultIndex === index,
        }"
        :key="result[1]"
        @click="emitResultObj({ type: result[0], value: result[1] })"
      >
        <div class="postcode-picker-results-result-primary-text">
          {{ result[2] }}
          &nbsp;
        </div>
        <div class="postcode-picker-results-result-secondary-text">
          {{ result[3].join(", ") }}
        </div>
      </button>
    </div>
  </form>
</template>

<script>
import { getCouncilDisplayName } from "@/functions.js";
import postcodes from "@/data/built/postcodes.json";
import councilNames from "@/data/built/councilNames.json";
import suburbsForPostcode from "@/data/suburbsForPostcode.json";

const RESULTS_LIMIT = 6;

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
    usePostcodes: {
      type: Boolean,
      required: true,
      default: false,
    },
    useCouncils: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  data() {
    return {
      inputValue: this.value,
      inputFocused: false,
      focusedResultIndex: 0,
      RESULTS_LIMIT,
    };
  },
  watch: {
    inputValue() {
      this.focusedResultIndex = 0;
    },
  },
  computed: {
    shouldShowResults() {
      return this.inputFocused && this.results.length > 0;
    },
    results() {
      // Format: [type, value, primary, secondary]
      // Type 1 = postcode, Type 2 = council
      // No type 0 to prevent falsy errors
      const results = [];
      const input = this.inputValue.trim();
      const inputNumber = Number(input);
      if (!isNaN(inputNumber)) {
        if (this.usePostcodes && inputNumber >= 2000 && inputNumber <= 2999)
          results.push([1, input, input, suburbsForPostcode[input] ?? []]);
      } else {
        // COUNCILS
        if (this.useCouncils) {
          for (let i = 0; i < councilNames.length; i++) {
            const council = councilNames[i];
            if (council.toLowerCase().startsWith(input.toLowerCase()))
              results.push([2, council, getCouncilDisplayName(i), []]);
          }
        }
        // POSTCODES
        if (this.usePostcodes) {
          for (let i = 0; i < postcodes.length; i++) {
            const p = postcodes[i];
            const suburbs = suburbsForPostcode[p] ?? [];
            const matchingSuburbs =
              suburbs.filter((suburbName) =>
                suburbName.toLowerCase().startsWith(input.toLowerCase())
              ) || [];
            if (matchingSuburbs.length > 0) {
              results.push([
                1,
                p,
                p,
                Array.from(new Set(matchingSuburbs.concat(suburbs))),
              ]);
            }
          }
        }
      }

      return results;
    },
  },
  methods: {
    formSubmitHandler() {
      const result = this.results[this.focusedResultIndex];
      if (result)
        this.emitResultObj({
          type: result[0],
          value: result[1],
        });
    },
    emitResultObj(obj) {
      this.$emit("submit", obj);
      this.inputValue = "";
      document.activeElement.blur();
    },
    keydownHandler(event) {
      // Up arrow handler
      if (event.keyCode === 38 && this.focusedResultIndex > 0)
        this.focusedResultIndex--;
      // Down arrow handler
      if (
        event.keyCode === 40 &&
        this.focusedResultIndex <
          Math.min(this.results.length, RESULTS_LIMIT) - 1
      )
        this.focusedResultIndex++;
    },
    setInputFocused(value) {
      // Wait for next frame before setting inputFocused to false when blurring
      // so that the buttons are still around for the click event to fire when
      // tapping on them and blurring the input
      setTimeout(() => (this.inputFocused = value), 0);
    },
  },
};
</script>

<style lang="scss">
.postcode-picker {
  display: flex;
  max-width: 100%;
  position: relative;
  z-index: 2;

  &-input {
    font: inherit;
    color: inherit;
    background: transparent;
    padding: 0.25em;
    border: 1px solid hsl(0, 0%, 65%);
    border-right: none;
    border-radius: 7px 0 0 7px;
    .has-results & {
      border-bottom-left-radius: 0;
    }
    min-width: 4em;
    width: 257px; // Firefox default
    flex-grow: 1;
    &.fullwidth {
      width: 100%;
    }

    // Remove input shadow on iOS
    appearance: none;

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
      color: hsl(0, 0%, 67%);
      opacity: 1;
    }

    &:focus {
      outline: none;
      border-color: hsl(0, 0%, 62%);
    }
  }

  &-button {
    font: inherit;
    color: inherit;
    border: none;
    background: #eee;
    font-size: 0.9em;
    padding: 0.5rem 1rem;
    border-radius: 5rem;
    cursor: pointer;
    border: 1px solid hsl(0, 0%, 65%);
    border-radius: 0 7px 7px 0;
    .has-results & {
      border-bottom-right-radius: 0;
    }
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

  &-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid hsl(0, 0%, 65%);
    border-top: none;
    border-radius: 0 0 7px 7px;
    overflow: hidden;

    &-result {
      appearance: none;
      background: transparent;
      color: inherit;
      font: inherit;
      border: none;
      cursor: pointer;
      width: 100%;
      display: flex;
      align-items: center;
      padding: 0.5rem 0.5rem;

      // On a touchscreen, make padding bigger so items are more clickable
      // See https://stackoverflow.com/a/14457567
      @media (pointer: coarse) {
        padding: 0.75rem 0.5rem;
      }

      &:not(:last-child) {
        border-bottom: 1px solid hsl(0, 0%, 70%);
      }

      &:hover {
        background: hsl(0, 0%, 97%);
      }

      &.focused {
        background: hsl(0, 0%, 96%);
      }

      &:active {
        background: hsl(0, 0%, 94%);
      }

      &-primary-text {
        font-weight: 600;
        white-space: nowrap;
      }

      &-secondary-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.9rem;
        opacity: 0.6;
      }
    }
  }
}
</style>
