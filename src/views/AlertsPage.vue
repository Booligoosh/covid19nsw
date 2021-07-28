<template>
  <div class="case-locations-page">
    <div class="case-locations">
      <div class="case-locations-location-picker">
        Search nearby alerts using:
        <div class="case-locations-location-picker-type-buttons">
          <button
            :class="{ active: locationType === 'gps' }"
            @click="setLocationType('gps')"
          >
            GPS
          </button>
          <button
            :class="{ active: locationType === 'postcode' }"
            @click="setLocationType('postcode')"
          >
            Postcode
          </button>
          <!-- <button
            :class="{ active: locationType === 'suburb' }"
            @click="locationType = 'suburb'"
          >
            Suburb
          </button> -->
        </div>
        <div v-if="locationType === 'gps' && !hasLocationPermission">
          <p>
            Please allow location access so we can show alerts closest to you.
            <em>Your location details won&rsquo;t leave your device.</em>
          </p>
          <button @click="getLocation">Allow location access</button>
        </div>
        <div v-if="locationType === 'postcode'">
          <PostcodePicker
            :key="postcode"
            :autofocus="false"
            :fullwidth="true"
            :textPlaceholder="true"
            @submit="postcodeSubmitHandler"
          />
        </div>
      </div>
      <h1 class="case-locations-title" v-if="latitude && longitude">
        Alerts near
        {{
          locationType === "gps" ? "your location" : `the postcode ${postcode}`
        }}
      </h1>
      <div
        class="page-error"
        v-if="latitude && longitude && $store.state.error"
      >
        ⚠ {{ $store.state.error }}
      </div>
      <div
        class="page-loading"
        v-else-if="latitude && longitude && !$store.state.caseLocations"
      >
        Loading&hellip;
      </div>
      <div v-else-if="latitude && longitude">
        <details
          class="case-locations-location"
          v-for="caseLocation of caseLocationRows"
          :key="caseLocation.id"
          :open="openToggle === caseLocation.id"
        >
          <summary
            @click.prevent="
              openToggle =
                openToggle === caseLocation.id ? null : caseLocation.id
            "
          >
            <div class="case-locations-location-place">
              <span :title="caseLocation.Address">
                {{ caseLocation.Venue }}, {{ caseLocation.Suburb }}
              </span>
              <span
                class="case-locations-location-place-distance"
                v-if="caseLocation.distance"
              >
                {{ caseLocation.distance.toFixed(1) }}km away
              </span>
            </div>
            <div class="case-locations-location-date-time">
              {{ caseLocation.Time }}
              <span class="case-locations-location-date-time-connector"
                >on</span
              >
              {{ caseLocation.Date }}
            </div>
            <div
              :class="[
                'case-locations-location-alert',
                `alert-type-${caseLocation.type}`,
              ]"
            >
              {{ caseLocation.Alert }}
            </div>
          </summary>
          <div class="case-locations-location-more-info">
            <div class="case-locations-location-more-info-address">
              <strong>Address:</strong> {{ caseLocation.Address }}
            </div>
            <div class="case-locations-location-more-info-html">
              <strong>Health advice:</strong>&nbsp;
              <span v-html="caseLocation.HealthAdviceHTML"></span>
            </div>
            <div class="case-locations-location-more-info-last-updated">
              <strong>Added/updated:</strong>
              {{ caseLocation["Last updated date"] }}
            </div>
          </div>
        </details>
        <div
          class="no-locations-placeholder"
          v-if="$store.state.caseLocations.length === 0"
        >
          There aren&rsquo;t any current case location alerts. Great job NSW! 🥳
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import getDistance from "geolib/es/getDistance";
import latLongForPostcodes from "../data/latLongForPostcodes.json";
import PostcodePicker from "../components/PostcodePicker.vue";

export default {
  components: { PostcodePicker },
  name: "AlertsPage",
  data() {
    return {
      locationType:
        this.$route.name === "PostcodeAlertsPage" ? "postcode" : "gps", // `gps`, `postcode`, or `suburb` in the near future
      gpsLatitude: null,
      gpsLongitude: null,
      hasLocationPermission: false,
      openToggle: null,
    };
  },
  created() {
    if (this.locationType === "gps") this.getLocationIfAlreadyAllowed();
    if (!this.$store.state.caseLocations)
      this.$store.dispatch("getCaseLocations");
  },
  watch: {
    locationType() {
      if (this.locationType === "gps") this.getLocationIfAlreadyAllowed();
    },
  },
  computed: {
    postcode() {
      return this.$route.params.postcode;
    },
    postcodeLatLong() {
      return latLongForPostcodes[this.postcode] || [];
    },
    latitude() {
      switch (this.locationType) {
        case "gps":
          return this.gpsLatitude || null;
        case "postcode":
          return this.postcodeLatLong[0] || null;
        default:
          return null;
      }
    },
    longitude() {
      switch (this.locationType) {
        case "gps":
          return this.gpsLongitude || null;
        case "postcode":
          return this.postcodeLatLong[1] || null;
        default:
          return null;
      }
    },
    caseLocationRows() {
      if (!this.latitude || !this.longitude) return [];

      console.log("Calculating caseLocationRows");
      console.log(this.latitude, this.longitude);

      return (this.$store.state.caseLocations || [])
        .map((caseLocation) => {
          // Distance from current location in km
          caseLocation.distance =
            getDistance(
              {
                latitude: this.latitude,
                longitude: this.longitude,
              },
              {
                latitude: caseLocation.Lat || 0,
                longitude: caseLocation.Lon || 0,
              }
            ) / 1000;
          // Add target=_blank to links
          caseLocation.HealthAdviceHTML =
            caseLocation.HealthAdviceHTML?.replace(
              /(href=['"].+?['"])/g,
              "$1 target='_blank'"
            );
          return caseLocation;
        })
        .sort((a, b) => a.distance - b.distance);
    },
    lastUpdatedString() {
      return this.$store.state.temporalCoverageTo.format("D MMMM");
    },
  },
  methods: {
    postcodeSubmitHandler(postcode) {
      this.$router.push({
        name: "PostcodeAlertsPage",
        params: { postcode },
      });
    },
    setLocationType(type) {
      if (this.$route.name !== "AlertsPage")
        this.$router.push({ name: "AlertsPage" });

      this.locationType = type;
    },
    async getLocationIfAlreadyAllowed() {
      const locationPermission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (locationPermission.state === "granted") {
        this.hasLocationPermission = true;
        this.getLocation();
      }
    },
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
.case-locations {
  width: 500px;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  &-location-picker {
    &-type-buttons {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin: 1rem 0;

      &:last-child {
        margin-bottom: 0;
      }

      button {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        color: inherit;
        padding: 0.25rem 1rem;
        background: white;
        border-radius: 7px;
        border: 1px solid hsl(0, 0%, 80%);
        margin: 0 auto;
        font-size: 0.9rem;
        cursor: pointer;

        &:not(:first-child) {
          border-left: 0;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
        &:not(:last-child) {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }

        &:hover {
          background: hsl(0, 0%, 98%);
        }

        &.active {
          background: hsl(0, 0%, 95%);
        }
      }
    }

    p:first-child {
      margin-top: 0;

      em {
        font-weight: 600;
      }
    }
  }

  &-title {
    font-weight: 600;
    margin-top: 1.75rem;
    margin-bottom: 1.25rem;
    font-size: 1.3rem;
    text-align: center;
  }

  &-location {
    margin: 0 -1.5rem;
    border-top: 1px solid hsl(0, 0%, 85%);

    summary {
      padding: 1rem 0.5rem;
      cursor: pointer;

      &:focus {
        outline: none;
      }

      &::marker {
        color: hsl(0, 0%, 50%);
      }

      > * {
        padding-left: 1rem;
        padding-right: 1rem;
      }
    }

    &-place {
      margin-top: -19.6px;
      font-weight: 600;
      margin-bottom: 0.2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      &-distance {
        font-size: 0.8rem;
        text-transform: uppercase;
        padding: 0.1rem 0.3rem;
        background: hsl(0, 0%, 85%);
        border-radius: 5px;
        margin-left: 0.2rem;
        flex-shrink: 0;
      }
    }

    &-date-time {
      font-weight: 500;
      font-size: 0.9rem;
      margin-bottom: 0.2rem;

      &-connector {
        // opacity: .8;
        font-weight: normal;
      }
    }

    &-alert {
      font-size: 0.9rem;

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

    &-more-info {
      font-size: 0.9rem;
      padding: 0 1.5rem;
      padding-bottom: 1rem;

      &-address {
        margin: 0.2rem 0;
      }

      &-html {
        margin-bottom: 0.2rem;
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

<style lang="scss">
// Unscoped as it's from v-html
.case-locations-location-more-info-html a {
  color: hsl(123, 50%, 28%);
}
</style>
