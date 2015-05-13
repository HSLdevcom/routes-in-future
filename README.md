## Requirements
1. Node, Npm, Bower, Gulp

### Run
1. Npm install
2. Bower install

### Notes:
Uses: https://github.com/hannesj/transitive.js for drawing routes on the leaflet map, some local modifications have been made in scripts/Transitive.js

### Known issues / things to improve:
- Some routes can't be focused because rSegment.pathSegment.startVertex(), rSegment.pathSegment.endVertex() returns null
- Can't type full adress into route search, you have to choose an adress from the autocomplete list.
- Some stops on some search results are being rendered on some zoom levels they shouldn't be rendered on, has something to do with TransitiveStyles and the styles for merged_stops or stops_pattern
- Replace own the autocomplete with autocomplete from https://github.com/HSLdevcom/openjourneyplanner-ui/ -project or build own using https://github.com/moroshko/react-autosuggest
- Some issues with leaflet map controls on mobile devices
- Scrolling the autocomplete container on mobile is difficult