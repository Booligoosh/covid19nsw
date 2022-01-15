<template>
  <div class="overall-vaccinations">
    <div
      class="overall-vaccinations-bar"
      :style="{
        '--first-pct': firstDose16Plus + '%',
        '--second-pct': secondDose16Plus + '%',
      }"
    ></div>
    <div class="overall-vaccinations-title">All of NSW</div>
    <div class="overall-vaccinations-metrics">
      <div class="overall-vaccinations-metrics-metric">
        <span class="overall-vaccinations-metrics-metric-num">
          {{ firstDose16Plus.toFixed(2) }}%
        </span>
        <span class="overall-vaccinations-metrics-metric-label">
          1st dose
        </span>
      </div>
      <div class="overall-vaccinations-metrics-metric">
        <span class="overall-vaccinations-metrics-metric-num">
          {{ secondDose16Plus.toFixed(2) }}%
        </span>
        <span class="overall-vaccinations-metrics-metric-label">
          2nd dose
        </span>
      </div>
      <div class="overall-vaccinations-metrics-metric">
        <span class="overall-vaccinations-metrics-metric-num">
          {{ thirdDose16Plus.toFixed(2) }}%
        </span>
        <span class="overall-vaccinations-metrics-metric-label">
          3rd dose
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import {
  firstDose16Plus,
  secondDose16Plus,
  thirdDose16Plus,
} from "../data/built/overallVaccinations.json";

export default {
  name: "OverallVaccinations",
  data() {
    return {
      firstDose16Plus,
      secondDose16Plus,
      thirdDose16Plus,
    };
  },
};
</script>

<style lang="scss">
.overall-vaccinations {
  border: 1px solid hsl(0, 0%, 85%);
  border-radius: 7px;
  overflow: hidden;
  width: 500px;
  max-width: 100%;
  margin: 0 auto;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &-bar {
    display: none;
    height: 4px;
    width: 100%;
    flex-shrink: 0;
    --first-color: hsl(123, 45%, 70%);
    --second-color: hsl(123, 45%, 30%);
    --unfilled-color: hsl(0, 0%, 87%);
    background: linear-gradient(
      90deg,
      var(--second-color) var(--second-pct),
      var(--first-color) var(--second-pct),
      var(--first-color) var(--first-pct),
      var(--unfilled-color) var(--first-pct),
      var(--unfilled-color) 100%
    );
    // border: 1px solid hsl(0, 0%, 70%);
  }

  &-title {
    padding: 0 0.4rem;
    padding-right: 0.75rem;
    margin-right: 0.75rem;
    text-align: center;
    font-size: 0.8rem;
    font-weight: 600;
    opacity: 0.5;
    border-right: 1.5px solid hsl(0, 0%, 50%);
  }

  &-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    text-align: center;
    justify-content: center;
    align-items: center;
    padding: 0.4rem;
    padding-left: 0;
    grid-gap: 1rem;
    width: max-content;

    &-metric {
      display: flex;
      flex-direction: column;
      align-items: center;

      &-num {
        font-weight: bold;
      }
      &-label {
        font-size: 0.7rem;
        font-weight: 500;
        opacity: 0.75;
        white-space: nowrap;
      }
    }
  }
}
</style>
