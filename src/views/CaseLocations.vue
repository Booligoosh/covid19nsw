<template>
  <div class="case-locations-page-error" v-if="$store.state.error">
    ⚠ {{ $store.state.error }}
  </div>
  <div
    class="case-locations-page-loading"
    v-else-if="$store.state.caseLocations.length === 0"
  >
    Loading&hellip;
  </div>
  <div class="case-locations-page" v-else>
    <div class="case-locations">
      <div class="case-locations-gps-box">
        <p v-if="!hasLocationPermission">
          Please allow access to your location so we can show your distance from
          case locations and sort by how far away they are.
          <em>Your location details will never leave your device.</em>
        </p>
        <button @click="getLocation()" v-if="!hasLocationPermission">
          Allow location access
        </button>
        <ExplainerText :isAboveData="true" />
      </div>
      <div
        class="case-locations-location"
        v-for="caseLocation of caseLocationRows"
        :key="caseLocation.id"
      >
        <div class="case-locations-location-place">
          {{ caseLocation.Venue }}, {{ caseLocation.Suburb }}

          <span
            class="case-locations-location-place-distance"
            v-if="caseLocation.distance"
          >
            {{ caseLocation.distance.toFixed(1) }}km away
          </span>
        </div>
        <div class="case-locations-location-date-time">
          {{ caseLocation.Time }}
          <span class="case-locations-location-date-time-connector">on</span>
          {{ caseLocation.Date }}
        </div>
        <div class="case-locations-location-address">
          {{ caseLocation.Address }}
        </div>
        <div
          :class="[
            'case-locations-location-alert',
            `alert-type-${caseLocation.type}`,
          ]"
        >
          {{ caseLocation.Alert }}
        </div>
        <!-- LAT,LON: <span style="user-select:all">{{ caseLocation.Lat }},{{ caseLocation.Lon }}</span> -->
      </div>
    </div>
  </div>
</template>

<script>
import ExplainerText from "../components/ExplainerText.vue";
import getDistance from "geolib/es/getDistance";

export default {
  name: "CaseLocations",
  components: {
    ExplainerText,
  },
  data() {
    return {
      latitude: null,
      longitude: null,
      hasLocationPermission: false,
    };
  },
  async created() {
    if (navigator.permissions) {
      const locationPermission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (locationPermission.state === "granted") {
        this.hasLocationPermission = true;
        this.getLocation();
      }
    } else {
      // If permission API is not supported, request location immediately on load.
      // If they deny it immediately, they can usually allow it later.
      // Suppress visible error messages since we're doing it without user interaction
      // and don't already have location permission.
      this.getLocation(true);
    }
  },
  computed: {
    caseLocationRows() {
      console.log("Calculating caseLocationRows");
      console.log(this.latitude, this.longitude);

      const unsortedCaseLocations = this.$store.state.caseLocations.map(
        (caseLocation) => {
          // Temporary workaround for incorrect Westfield Bondi Junction coordinates
          if (caseLocation.Venue === "Westfield Bondi Junction") {
            caseLocation.Lat = -33.892139;
            caseLocation.Lon = 151.247375;
          }

          // Distance from current location in km
          caseLocation.distance =
            this.latitude && this.longitude
              ? getDistance(
                  {
                    latitude: this.latitude,
                    longitude: this.longitude,
                  },
                  {
                    latitude: caseLocation.Lat,
                    longitude: caseLocation.Lon,
                  }
                ) / 1000
              : null;
          return caseLocation;
        }
      );

      if (this.hasLocationPermission) {
        return unsortedCaseLocations.sort((a, b) => a.distance - b.distance);
      } else {
        return unsortedCaseLocations;
      }
    },
    lastUpdatedString() {
      return this.$store.state.temporalCoverageTo.format("D MMMM");
    },
  },
  methods: {
    async getLocation(supressErrors = false) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.hasLocationPermission = true;
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
        },
        () => {
          if (supressErrors) {
            console.log("Couldn't determine location");
          } else {
            alert("We couldn’t determine your location!");
          }
        }
      );
    },
  },
};
</script>

<style lang="scss" scoped>
.case-locations-page-loading,
.case-locations-page-error {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.case-locations-page-error {
  color: red;
}

.case-locations {
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;

  &-gps-box {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid hsl(0, 0%, 95%);

    p {
      margin: 0;

      em {
        font-weight: 600;
      }
    }

    button {
      margin-top: 1rem;
    }
  }

  &-location {
    margin-bottom: 2rem;
    padding: 1rem;
    border: 1px solid hsl(0, 0%, 90%);
    border-radius: 10px;

    &-place {
      font-weight: 600;
      margin-bottom: 0.5rem;

      &-distance {
        font-size: 0.8rem;
        text-transform: uppercase;
        padding: 0.1rem 0.3rem;
        background: hsl(0, 0%, 85%);
        border-radius: 5px;
        margin-left: 0.2rem;
      }
    }

    &-date-time {
      font-weight: 500;
      margin-bottom: 0.5rem;

      &-connector {
        // opacity: .8;
        font-weight: normal;
      }
    }

    &-address {
      font-style: italic;
      opacity: 0.5;
      margin-bottom: 0.5rem;
    }

    &-alert {
      &.alert-type-isolate {
        color: hsl(0, 100%, 38%);
      }

      &.alert-type-negative {
        // color: hsl(39, 100%, 32%);
        color: hsl(28, 100%, 43%);
      }

      &.alert-type-monitor {
        color: hsl(194, 100%, 33%);
      }
    }
  }
}
</style>
