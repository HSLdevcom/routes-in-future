var app;
function App(){
  React.initializeTouchEvents(true);
  var _this = this;
  this.DATA = DATA;
  this.map =  L.map('map', {
    inertia: false,
    zoomAnimation: false
  });
  
  var styles = setTransitiveStyles();
  this.STYLES = styles[0];
  this.OLD_STYLES = styles[1];
  this.focusedJourney = '';
  // this.map.on('zoomend',function(){
  //   console.log(_this.focusedJourney)
  //   console.log(_this.transitive)
  //    _this.transitive.focusJourney(_this.focusedJourney);
  // });
  this.transitive = new Transitive({
    data: this.DATA,
    styles:this.STYLES,
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
  this.oldTransitive = new Transitive({
    data:{},
    styles:this.OLD_STYLES,
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
  this.oldTransitiveLayer = new L.TransitiveLayer(this.oldTransitive);
  this.transitiveLayer = new L.TransitiveLayer(this.transitive);
  this.oldRoutes = [];
  this.getOldRoutes().done(function(data){
    _this.oldRoutes = data;
  });
  this.COMPUTED = [

    // showLabelsOnHover,
    // highlightOptionOnHover
  ];
  this.transitive.on('render', function(transitive) {
     if(_this.focusedJourney !== '' &&  _this.transitive.data!==null && typeof _this.transitive.data.journeys[_this.focusedJourney]!=='undefined') {
        _this.transitive.focusJourney(_this.focusedJourney);
     } else {
        _this.transitive.focusJourney();
     }
    // _this.COMPUTED.map(function(behaviour) {

    //   behaviour(transitive.network);
    // });
  });
  this.initializeMapLayers();
  React.render(React.createElement(LeftSidebar, {data: this.DATA}), document.getElementById('sidebar'));
};
App.prototype.getOldRoutes = function() {
  return $.get('http://matka.hsl.fi/otp/routers/default/index/agencies/HSL/routes');
}
//DATA.allPatterns = DATA.patterns;
App.prototype.showRoutesOnMap = function(data, type) {
  // Create journeys of active routes, if its search results leave the journeys alone
  if (type !== 'routesearch') {
    data.journeys = [];
    var routeIds = _.where(data.routes, {active:true}).map(function(route) {
      return route.route_id
    });
    var patterns = _.uniq(_.filter(data.patterns, function(pattern) {
      if (routeIds.indexOf(pattern.route_id) !== -1) {
        return true;
      } else {
        return false;
      }
    }), 'route_id');

    data.journeys = patterns.map(function(pattern) {
      return {
        journey_id: 'j_' + pattern.pattern_id,
        journey_name: 'Pattern:' + pattern.pattern_id,
        focus: false,
        segments: [{
          type: 'TRANSIT',
          pattern_id: pattern.pattern_id,
          from_stop_index: 0,
          to_stop_index: (pattern.stops.length - 1)
        }]
      };
    });

  }

  if (type === 'new' || type === 'routesearch') {
    this.transitive.updateData(data);
    if (data.journeys.length) {
      this.map.fitBounds(this.transitiveLayer.getBounds());
    } else {
      this.map.setView([60.287481, 24.996849], 11);
    }
    if(type==='routesearch') {
      this.transitive.focusJourney(this.focusedJourney);
    }
  } else if (type === 'old') {
    this.oldTransitive.clearData();
    data.patterns = data.patterns.map(function(pattern, index) {
      pattern.render = (index === 0) ? true : false;
      return pattern;
    });
    this.oldTransitive.updateData(data);
  }
}
App.prototype.openRouteInfo = function(route){
  React.render(React.createElement(RouteInfoModal, {route: route}), document.getElementById('route-info-modal'));
};
App.prototype.clearRoutesOnMap = function() {
  this.oldTransitive.clearData();
  this.transitive.clearData();
  this.map.setView([60.287481, 24.996849], 11);
}

/**
 * Show labels on hover
 */

function showLabelsOnHover(transitive) {
  _.forEach(transitive.stops, function(stop) {
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

App.prototype.initializeMapLayers = function() {
  var _this = this;
  L.tileLayer('http://matka.hsl.fi/hsl-map/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
  }).addTo(this.map);
  
  this.map.addLayer(this.oldTransitiveLayer);
  this.map.addLayer(this.transitiveLayer);

  
  this.map.setView([60.287481, 24.996849], 11);
}

$(document).ready(function() {
  app = new App();
  
  $('.read-more-link').on('click', function(e) {
    e.preventDefault();
    $(this).toggleClass('open');
    $('.more-info').toggleClass('open');
    $('#sidebar').toggleClass('hidden');
  });
  $('.left-sidebar').on('click', function() {
    $('.welcome-text').removeClass('open');
  });
  $('.welcome-text .close').on('click', function() {
    $('.welcome-text').removeClass('open');
  });
});
