<template>
  <div class="scatter-page">
    <p>⚠ This page is a work-in-progress. Make conclusions at your own risk!</p>
    <canvas id="scatter-chart" width="400" height="400"></canvas>
  </div>
</template>

<script>
import { getVaccineRangeIndex } from "@/functions.js";
import postcodes from "@/data/built/postcodes.json";
import postcodeCounts from "@/data/built/postcodeCounts.json";
import postcodeVaccinations from "@/data/built/postcodeVaccinations.json";

import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default {
  mounted() {
    const xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const ysForXs = {};
    const postcodesData = postcodes
      .map((p, i) => {
        const x = getVaccineRangeIndex(postcodeVaccinations[p]?.[1]);
        const y = postcodeCounts.newCasesThisWeek[i] || 0;

        if (x === -1) return null;
        ysForXs[x] = ysForXs[x]?.concat(y) || [y];
        return { x, y, _p: p };
      })
      .filter((p) => !!p);
    console.log(postcodesData);

    const ctx = document.getElementById("scatter-chart").getContext("2d");
    new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Postcodes",
            backgroundColor: "hsla(123, 45%, 40%,.5)",
            data: postcodesData,
            // pointRadius: 2,
          },
          {
            label: "Average",
            type: "line",
            pointRadius: 2,
            borderColor: "purple",
            borderWidth: 1,
            data: xs.map((x) => {
              const ys = ysForXs[x] || [];
              const avg =
                ys.length === 0
                  ? null
                  : (ys.reduce((a, b) => a + b) / ys.length).toFixed(2);
              return { x, y: avg };
            }),
          },
          {
            label: "Average (excluding zero-case postcodes)",
            type: "line",
            pointRadius: 2,
            borderColor: "blue",
            borderWidth: 1,
            data: xs.map((x) => {
              const ys = (ysForXs[x] || []).filter((y) => !!y);
              const avg =
                ys.length === 0
                  ? null
                  : (ys.reduce((a, b) => a + b) / ys.length).toFixed(2);
              return { x, y: avg };
            }),
          },
          {
            label: "Median (excluding zero-case postcodes)",
            type: "line",
            pointRadius: 2,
            borderColor: "red",
            borderWidth: 1,
            data: xs.map((x) => {
              const ys = (ysForXs[x] || [0])
                .filter((y) => !!y)
                .sort((a, b) => a - b);
              const i = ys.length / 2;
              const median =
                i % 1 == 0 ? (ys[i - 1] + ys[i]) / 2 : ys[Math.floor(i)];
              return { x, y: median || null };
            }),
          },
        ],
      },
      options: {
        scales: {
          y: {
            title: {
              display: true,
              text: "Cases this week",
            },
            beginAtZero: true,
            // type: "logarithmic",
          },
          x: {
            max: 9,
            title: {
              display: true,
              text: "% population aged 15+ fully vaccinated",
            },
            ticks: {
              minRotation: 90,
              maxRotation: 90,
              callback: function (value) {
                return [
                  "0-9%",
                  "10-19%",
                  "20-29%",
                  "30-39%",
                  "40-49%",
                  "50-59%",
                  "60-69%",
                  "70-79%",
                  "80-89%",
                  "90%+",
                ][value];
              },
            },
          },
        },
        plugins: {
          legend: {
            // display: false,
          },
          tooltip: {
            callbacks: {
              label(item) {
                console.log("TITLE", item);
                if (item.datasetIndex === 0) {
                  return `${item.raw._p}: ${item.parsed.y} cases`;
                } else {
                  return `${item.dataset.label}: ${item.parsed.y} cases`;
                }
              },
            },
          },
        },
      },
    });
  },
};
</script>

<style lang="scss">
.scatter-page {
  #scatter-chart {
    max-height: 500px;
  }
}
</style>
