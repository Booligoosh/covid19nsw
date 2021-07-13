<template>
  <div class="case-locations-page-error" v-if="$store.state.error">
    ⚠ {{ $store.state.error }}
  </div>
  <div
    class="case-locations-page-loading"
    v-else-if="!$store.state.caseLocations"
  >
    Loading&hellip;
  </div>
  <div class="case-locations-page" v-else>
    <div class="case-locations">
      <div class="case-locations-gps-box" v-if="!hasLocationPermission">
        <p>
          Please allow access to your location so we can show your distance from
          case locations and sort by how far away they are.
          <em>Your location details will never leave your device.</em>
        </p>
        <button @click="getLocation">Allow location access</button>
        <p>Or, choose your suburb below for approximate locations:</p>
        <input
          list="suburbs-datalist"
          placeholder="Start typing your suburb name"
          v-model="suburbNameInput"
        />
        <datalist id="suburbs-datalist">
          <option v-for="suburbName of suburbNames" :key="suburbName">
            {{ suburbName }}
          </option>
        </datalist>
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
      <div
        class="no-locations-placeholder"
        v-if="$store.state.caseLocations.length === 0"
      >
        There aren&rsquo;t any current case location alerts. Great job NSW! 🥳
      </div>
    </div>
  </div>
</template>

<script>
import getDistance from "geolib/es/getDistance";
import latLongForSuburbs from "../data/latLongForSuburbs.json";

export default {
  name: "CaseLocations",
  data() {
    return {
      gpsLatitude: null,
      gpsLongitude: null,
      hasLocationPermission: false,
      suburbNameInput: "",
    };
  },
  async created() {
    const locationPermission = await navigator.permissions.query({
      name: "geolocation",
    });

    if (locationPermission.state === "granted") {
      this.hasLocationPermission = true;
      this.getLocation();
    }
  },
  computed: {
    suburbLatLong() {
      // Check case-sensitively (fastest) first
      let suburbLatLong = latLongForSuburbs[this.suburbNameInput] || null;
      // Check case-insensitively as a backup for browsers that don't support datalist
      if (!suburbLatLong)
        suburbLatLong =
          latLongForSuburbs[
            this.suburbNames.find(
              (n) => this.suburbNameInput.toLowerCase() === n.toLowerCase()
            )
          ] || null;

      // Fall back to empty array (so checking an index of it never throws an error)
      if (!suburbLatLong) suburbLatLong = [];
      // Return the suburbLatLong in the format [latNum, longNum]
      return suburbLatLong;
    },
    latitude() {
      return this.gpsLatitude || this.suburbLatLong[0] || null;
    },
    longitude() {
      return this.gpsLongitude || this.suburbLatLong[1] || null;
    },
    caseLocationRows() {
      console.log("Calculating caseLocationRows");
      console.log(this.latitude, this.longitude);

      const unsortedCaseLocations = (this.$store.state.caseLocations || []).map(
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

      if (this.hasLocationPermission || this.suburbLatLong.length > 0) {
        return unsortedCaseLocations.sort((a, b) => a.distance - b.distance);
      } else {
        return unsortedCaseLocations;
      }
    },
    lastUpdatedString() {
      return this.$store.state.temporalCoverageTo.format("D MMMM");
    },
    suburbNames() {
      return Object.keys(latLongForSuburbs);
    },
  },
  methods: {
    async getLocation() {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.hasLocationPermission = true;
          this.gpsLatitude = position.coords.latitude;
          this.gpsLongitude = position.coords.longitude;
        },
        (err) => {
          this.hasLocationPermission = false;
          // See https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError/code
          switch (err.code) {
            case 1:
              alert(
                "We don't have permission to access your location. Please enable location permission for this site manually (search up how to do it in your browser if unsure) and try again."
              );
              break;
            case 2:
              alert(
                "We couldn’t determine your location: Your position is unavailable."
              );
              break;
            case 3:
              alert(
                "We couldn’t determine your location: The location request timed out."
              );
              break;
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

    button,
    p {
      margin-top: 1rem;
    }

    p:first-child {
      margin: 0;

      em {
        font-weight: 600;
      }
    }

    input {
      width: 100%;
      font: inherit;
      color: inherit;
      border-radius: 5px;
      border: 1px solid hsl(0, 0%, 75%);
      padding: 0.25rem;
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

.no-locations-placeholder {
  padding: 2.5rem 1rem;
  border: 1px solid hsl(0, 0%, 90%);
  border-radius: 10px;
  text-align: center;
  font-weight: 500;
  color: hsl(0, 0%, 40%);
  line-height: 1.5;
}
</style>
