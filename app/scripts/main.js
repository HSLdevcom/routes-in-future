var initialLayers = L.layerGroup();
var showLayer = L.layerGroup();
var oldRouteLayer = L.layerGroup();
var map;
var transitive;
var oldTransitive;
var oldroutenumbers;
var oldTransitiveData;
var oldRoutes;
var COMPUTED = [
  // showLabelsOnHover,
  // highlightOptionOnHover
];
//DATA.allPatterns = DATA.patterns;
function showRoutesOnMap(DATA,type) {
  // Create journeys of active routes, if its search results leave the journeys alone
  if(type!=='routesearch') {
    DATA.journeys = [];
    var routeIds = _.where(DATA.routes,{active:true}).map(function(route) {
      return route.route_id
    });
    var patterns = _.filter(DATA.patterns, function(pattern){
      if(routeIds.indexOf(pattern.route_id) !== -1) {
        return true;
      } else {
        return false;
      }
    });

    DATA.journeys = patterns.map(function(pattern){
      return {
        journey_id: 'j_'+pattern.pattern_id,
        journey_name: 'Pattern:'+pattern.pattern_id,
        focus: false,
        segments: [{
          type: 'TRANSIT',
          pattern_id: pattern.pattern_id,
          from_stop_index: 0,
          to_stop_index: (pattern.stops.length-1)
        }]
      };
    });
  }

  if(type === 'new' || type === 'routesearch') {
    transitive.updateData(DATA);
    transitive.focusJourney();
    oldTransitive.clearData();
    oldTransitive.updateData({});

  } else if(type === 'old') {
    oldTransitive.clearData();
    oldTransitive.updateData(DATA);
  }
}
function clearRoutesOnMap() {
  oldTransitive.clearData();
  showLayer.clearLayers();
  DATA.journeys = [];
  transitive.updateData(DATA);
}

/**
 * Show labels on hover
 */

function showLabelsOnHover(transitive) {
  _.forEach(transitive.stops,function(stop) {
    if (!stop.svgGroup) return;
    stop.svgGroup.selectAll('.transitive-stop-circle')
      .on('mouseenter', function(data) {

        stop.svgGroup.select('#transitive-stop-label-' + data.point.getId())
          .style('visibility', 'visible');
      })
      .on('mouseleave', function(data) {
        stop.svgGroup.select('#transitive-stop-label-' + data.point.getId())
          .style('visibility', 'hidden');
      });
  });
}

/**
 * Highlight option on hover
 */

function highlightOptionOnHover(transitive) {
  _.forEach(transitive.journeys, function(journey) {
    _.forEach(journey.path.segments, function(segment) {
      _.forEach(segment.renderedSegments, function(segment) {
        var currentColor = segment.lineGraph.style('stroke');
        segment.lineGraph.on('mouseenter', function(data) {
            // highlight the path
            segment.lineGraph.style('stroke', '#000');
            var edge = segment.graphEdge;
          }).on('mouseleave', function(data) {

            segment.lineGraph.style('stroke', currentColor);
          });
      });
    });
  });
}

function startMap() {
  var stopLatLongs = [];
  var stopStartMarkers = [];
  var polylines = [];
  var markers = [];
  var oneway = [];
  var marker;

  map = L.map('map', {
    inertia: false,
    zoomAnimation: false
  });

  L.tileLayer('http://matka.hsl.fi/hsl-map/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
  }).addTo(map);

  for (var i = 0; i <= DATA.patterns.length - 1; i++) {
    stopLatLongs = [];
    stopLatLongs = DATA.patterns[i].stops.map(function(stop, index) {
      var stopData = _.where(DATA.stops, {stop_id:stop.stop_id})[0];
      var arr = [stopData.stop_lat, stopData.stop_lon];
      if (index === 0) {
        DATA.patterns[i].startMarker = L.marker(arr, {title:stopData.stop_name}).bindPopup(stopData.stop_name);
      } else if (index === (DATA.patterns[i].stops.length - 1)) {
        DATA.patterns[i].stopMarker = L.marker(arr, {title:stopData.stop_name}).bindPopup(stopData.stop_name);
      }

      return arr;
    });

    DATA.patterns[i].stopLatLongs = stopLatLongs;
    DATA.patterns[i].polyline = L.polyline(stopLatLongs, {color: 'blue'});
  }

  transitive = new Transitive({
    data: DATA,
    styles:STYLES,
    zoomFactors: [{
      minScale: 0,
      gridCellSize: 25,
      internalVertexFactor: 1000000,
      angleConstraint: 22.5,
      mergeVertexThreshold: 200
    }, {
      minScale: 1.5,
      gridCellSize: 0,
      internalVertexFactor: 0,
      angleConstraint: 5,
      mergeVertexThreshold: 0
    }]
  });

  oldTransitive = new Transitive({
    data:{},
    styles:OLD_STYLES,
    zoomFactors: [{
      minScale: 0,
      gridCellSize: 25,
      internalVertexFactor: 1000000,
      angleConstraint: 22.5,
      mergeVertexThreshold: 200
    }, {
      minScale: 1.5,
      gridCellSize: 0,
      internalVertexFactor: 0,
      angleConstraint: 5,
      mergeVertexThreshold: 0
    }]
  });
  oldRouteLayer.addLayer(new L.TransitiveLayer(oldTransitive))
  map.addLayer(new L.TransitiveLayer(transitive));
  map.addLayer(oldRouteLayer);
  transitive.on('render',function(transitive){
    COMPUTED.map(function(behaviour){

      behaviour(transitive.network);
    });
  });
  map.setView([60.287481, 24.996849], 11);
}

$(document).ready(function() {
  startMap();
  oldroutenumbers = _.uniq(replacementLines.map(function(line) {
    return line.oldLines;
  })
  .reduce(function(a,b) {
    return a.concat(b);
  }));
  $.get('http://matka.hsl.fi/otp/routers/default/index/agencies/HSL/routes').done(function(data){
    oldRoutes = data;
  });

});
