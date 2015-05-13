## Requirements
1. Node, Npm, Bower, Gulp

### Run
1. Npm install
2. Bower install

### Notes:
Uses: https://github.com/hannesj/transitive.js for drawing routes on the leaflet map, some local modifications have been made in scripts/Transitive.js

### Known issues:
- Some routes can't be focused because rSegment.pathSegment.startVertex(), rSegment.pathSegment.endVertex() returns null
- Can't type full adress into route search, you have to choose an adress from the autocomplete list.
- Some stops on some search results are being rendered on some zoom levels, has something to do with TransitiveStyles and the styles for merged_stops or stops_pattern
- Route results could be stylized a bit.
- Replace own autocomplete with some react-autocomplete library?