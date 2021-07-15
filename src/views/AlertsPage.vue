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
        <div v-if="locationType === 'gps'">
          <p>
            Please allow access to your location so we can show alerts closest
            to you.
            <em>Your location details won&rsquo;t leave your device.</em>
          </p>
          <button v-if="!hasLocationPermission" @click="getLocation">
            Allow location access
          </button>
          <button v-else disabled>✅ Location access granted</button>
        </div>
        <div v-if="locationType === 'postcode'">
          <p>Enter your postcode below:</p>
          <PostcodePicker
            :value="postcode"
            :fullwidth="true"
            @submit="postcodeSubmitHandler"
          />
        </div>
      </div>
      <div
        class="case-locations-location"
        v-for="caseLocation of caseLocationRows"
        :key="caseLocation.id"
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
    };
  },
  created() {
    if (this.locationType === "gps") this.getLocationIfAlreadyAllowed();
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
          // Temporary workaround for incorrect Westfield Bondi Junction coordinates
          if (caseLocation.Venue === "Westfield Bondi Junction") {
            caseLocation.Lat = -33.892139;
            caseLocation.Lon = 151.247375;
          }

          // Distance from current location in km
          caseLocation.distance =
            getDistance(
              {
                latitude: this.latitude,
                longitude: this.longitude,
              },
              {
                latitude: caseLocation.Lat,
                longitude: caseLocation.Lon,
              }
            ) / 1000;
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

  &-location-picker {
    padding-bottom: 2rem;

    &-type-buttons {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin: 1rem 0;

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

        &:active {
          background: hsl(0, 0%, 94%);
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

  &-location {
    margin: 0 -1.5rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid hsl(0, 0%, 90%);

    &-place {
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

    &-address {
      display: none;
      font-style: italic;
      font-size: 0.9rem;
      opacity: 0.5;
      margin-bottom: 0.2rem;
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
