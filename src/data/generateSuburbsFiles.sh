curl https://www.nsw.gov.au/dcs_clinics_manager/suburbs > suburbs.json && \
node generateSuburbListNSW.js && \
node generateSuburbsForPostcode.js && \
node generateLatLongForSuburbs.js && \
curl https://raw.githubusercontent.com/matthewproctor/australianpostcodes/master/australian_postcodes.json > australian_postcodes.json && \
node generateLatLongForPostcodes.js