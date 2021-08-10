<template>
  <div>
    <div class="metric-switcher">
      <button
        @click="property = 'newCasesToday'"
        :class="{ active: property === 'newCasesToday' }"
      >
        Cases today
      </button>
      <button
        @click="property = 'newCasesThisWeek'"
        :class="{ active: property === 'newCasesThisWeek' }"
      >
        Cases this week
      </button>
      <button
        @click="property = 'outbreakTotalCases'"
        :class="{ active: property === 'outbreakTotalCases' }"
      >
        Cases since {{ OUTBREAK_START_DATE_FORMATTED }}
      </button>
    </div>
    <div id="map"></div>
  </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import geojson from "@/data/spatial/postcodes/geojson.json";
import postcodes from "@/data/built/postcodes.json";
import postcodeCounts from "@/data/built/postcodeCounts.json";
import suburbsForPostcode from "@/data/suburbsForPostcode.json";
import { OUTBREAK_START_DATE_FORMATTED } from "@/constants";

export default {
  data() {
    return {
      property: "newCasesThisWeek",
      map: null,
      geojsonLayer: null,
      info: null,
      OUTBREAK_START_DATE_FORMATTED,
    };
  },
  watch: {
    property() {
      this.updateColors();
    },
  },
  computed: {
    maxValue() {
      return Object.values(postcodeCounts[this.property]).sort(
        (a, b) => b - a
      )[0];
    },
  },
  methods: {
    style(feature) {
      const d =
        postcodeCounts[this.property][postcodes.indexOf(feature.properties.p)] /
        this.maxValue;
      return {
        weight: 1,
        opacity: 0.5,
        color: "black",
        fillOpacity: 0.7,
        fillColor: d ? `hsl(123,80%,${80 - d * 70}%)` : "white",
      };
    },

    highlightFeature(e) {
      const layer = e.target;

      layer.setStyle({
        weight: 5,
        color: "#666",
      });

      this.info.update(layer.feature.properties);
    },
    resetHighlight(e) {
      this.geojsonLayer.resetStyle(e.target);
      this.info.update();
    },

    zoomToFeature(e) {
      this.map.fitBounds(e.target.getBounds());
    },
    setupLeafletMap() {
      // https://leafletjs.com/examples/choropleth/
      this.map = L.map("map", {
        center: [-33.86785, 151],
        zoom: 10,
        preferCanvas: true,
      });

      // See https://leaflet-extras.github.io/leaflet-providers/preview/
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(this.map);

      this.info = L.control();
      this.info.onAdd = function () {
        this._div = L.DomUtil.create("div", "map-info"); // create a div with a class "info"
        this.update();
        return this._div;
      };
      this.info.update = function (props) {
        const i = postcodes.indexOf(props?.p);
        const today = postcodeCounts.newCasesToday[i] || 0;
        const thisWeek = postcodeCounts.newCasesThisWeek[i] || 0;
        const total = postcodeCounts.outbreakTotalCases[i] || 0;
        const suburbs = suburbsForPostcode[props?.p];

        this._div.innerHTML = props
          ? `<h3>${props.p}</h3>
            <hr/>${today} case${today !== 1 ? "s" : ""} today
            <br/>${thisWeek} case${thisWeek !== 1 ? "s" : ""} this week
            <br/>${total} case${
              total !== 1 ? "s" : ""
            } since ${OUTBREAK_START_DATE_FORMATTED}
            <hr/>
            <h4><b>Suburbs:</b> ${suburbs}</h4>`
          : "Hover over a postcode";
      };
      this.info.addTo(this.map);

      this.geojsonLayer = L.geoJson(geojson, {
        style: this.style,
        onEachFeature: (feature, layer) =>
          layer.on({
            mouseover: this.highlightFeature,
            mouseout: this.resetHighlight,
            click: this.zoomToFeature,
          }),
      }).addTo(this.map);
    },
    updateColors() {
      this.geojsonLayer.eachLayer((layer) =>
        layer.setStyle(this.style(layer.feature))
      );
    },
  },
  mounted() {
    this.setupLeafletMap();
  },
};
</script>

<style lang="scss">
$border-color: hsl(0, 0%, 80%);
$border-radius: 7px;

.metric-switcher {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 1px;
  background: $border-color;
  border: 1px solid $border-color;
  border-top-left-radius: $border-radius;
  border-top-right-radius: $border-radius;
  overflow: hidden;

  button {
    color: inherit;
    font: inherit;
    border: none;
    cursor: pointer;
    background: white;
    padding: 1rem;
    font-size: 0.9rem;

    &:hover {
      background: hsl(0, 0%, 98%);
    }

    &.active {
      background: hsl(0, 0%, 95%);
    }

    &:active {
      background: hsl(0, 0%, 93%);
    }
  }
}
#map {
  flex-grow: 1;
  border: 1px solid $border-color;
  border-top: none;
  border-bottom-left-radius: $border-radius;
  border-bottom-right-radius: $border-radius;
}
.map-info {
  font-size: 0.8rem;
  padding: 6px 8px;
  background: white;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  width: 200px;

  h3 {
    margin: 0;
  }

  h4 {
    margin: 0;
    font-weight: normal;
    font-size: 0.8rem;
    line-height: 1.1;

    b {
    }
  }

  hr {
    border: none;
    border-bottom: 1px solid black;
  }
}
</style>
