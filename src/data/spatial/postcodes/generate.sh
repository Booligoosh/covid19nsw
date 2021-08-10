# Generates minified & transformed GeoJSON file ./geojson.json from ./source folder contents
# 0.0001 = 4dp = ~11m precision
# See https://dpstyles.tumblr.com/post/95952859425/how-does-the-precision-of-a-lat-long-change-with-the
mapshaper ./source/POA_2016_AUST.shp -simplify dp 10% keep-shapes -o geojson.json format=geojson precision=0.0001 && node transformGeojson.js