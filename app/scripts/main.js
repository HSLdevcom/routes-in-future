var initialLayers = L.layerGroup();
var showLayer = L.layerGroup();
var map;
var transitive;
DATA.allPatterns = DATA.patterns;
function getRoutePattern(routeId) {
  var routePattern = _.find(DATA.allPatterns, {route_id:routeId});
  return routePattern;
}
function showRoutesOnMap(routes) {
  // var maxRouteLat = 0;
  // var maxRouteLon = 0;
  // var minRouteLat = 0;
  // var minRouteLon = 0;
  // showLayer.clearLayers();
  // for(var i=0; i<routes.length; i++) {
  //   showLayer.addLayer(routes[i].polyline);
  //   showLayer.addLayer(routes[i].startMarker);
  //   showLayer.addLayer(routes[i].stopMarker);
  // }
  DATA.patterns = [];
  DATA.allPatterns.map(function(pattern, index) {
    for (var i = 0; i < routes.length; i++) {
      if (pattern.route_id === routes[i].route_id) {
        pattern.render = true;
        DATA.patterns.push(pattern);
      }

    }

  });
  
  transitive.updateData(DATA);

  //map.fitBounds([route.stopLatLongs[0],route.stopLatLongs[(route.stopLatLongs.length-1)]]);
}
function clearRoutesOnMap(){
  showLayer.clearLayers();
  DATA.patterns = [];
  transitive.updateData(DATA);
}
function startMap() {

    var stopLatLongs=[];
    var stopStartMarkers=[];
    var polylines = [];
    var markers = [];
    var oneway = [];
    var marker;

   map = L.map('map',{
    inertia: false,
    zoomAnimation: false
  });
  L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
  			maxZoom: 18,
  			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
  				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
  				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
  			id: 'examples.map-i875mjb7'
  }).addTo(map);
  for(var i=0; i<= DATA.patterns.length-1; i++){
    stopLatLongs = [];
    stopLatLongs = DATA.patterns[i].stops.map(function(stop,index){
      var stopData = _.where(DATA.stops,{'stop_id':stop.stop_id})[0];
      var arr = [stopData.stop_lat,stopData.stop_lon];
      if(index===0) {
        DATA.patterns[i].startMarker = L.marker(arr,{title:stopData.stop_name}).bindPopup(stopData.stop_name);
      } else if(index===DATA.patterns[i].stops.length-1) {
        DATA.patterns[i].stopMarker = L.marker(arr,{title:stopData.stop_name}).bindPopup(stopData.stop_name);
      }
      return arr;
    });
    DATA.patterns[i].stopLatLongs = stopLatLongs;
    DATA.patterns[i].polyline = L.polyline(stopLatLongs, {color: 'blue'});
  }
  // initialLayers.addTo(map);
  // create the Transitive instance
  // var journeys = [];
  // journeys = DATA.patterns.map(function(pattern) {
  //
  //   return {
  //     "journey_id": "journey_pattern_"+pattern.pattern_id,
  //     "journey_name": "journey for pattern:"+pattern.pattern_id,
  //     "segments": [{
  //       "type": "TRANSIT",
  //       "pattern_id": pattern.pattern_id,
  //       "from_stop_index": 0,
  //       "to_stop_index": (pattern.stops.length-1)
  //     }]
  //     };
  // });
  // DATA.journeys = journeys.slice(0,50);
  transitive = new Transitive({
     data: DATA,
     autoResize: false,
     zoomEnabled: false
  });
  map.addLayer(new L.TransitiveLayer(transitive));
  //map.addLayer(showLayer);
  map.setView([60.287481, 24.996849], 11);
  // O/D points
  // var od = {
  //   from: {
  //     name: 'Home',
  //     lat: 60.187578,
  //     lon: 24.960113
  //   },
  //   to: {
  //     name: 'Work',
  //     lat: 60.199012,
  //     lon: 24.940372
  //   }
  // };

  // Create new instance
  // var profiler = new OtpProfiler({
  //   host: 'http://matka.hsl.fi/otp/routers/default',
  //   limit: 3 // limit the number of options to profile, defaults to 3
  // });
  // profiler.profile(od, function(err, profile) {
  //   console.log(profile); // Outputs the profile of the journey
  // });
}
$(document).ready(function() {
  startMap();
});
