// This file is an override for users who last loaded this site when it still had the old service worker.
// This script used to be loaded by that version, but is not by newer versions, so this is a way of injecting code into those older versions.

const SEARCH_STRING = "?ref=sw_fix";

if (window.location.search !== SEARCH_STRING) {
  window.location.search = SEARCH_STRING;
} else {
  window.location.reload(true);
}
