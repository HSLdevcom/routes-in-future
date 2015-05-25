function App(){
  React.initializeTouchEvents(true);
  var _this = this;
  this.DATA = DATA;
  this.map =  L.map('map', {
    inertia: false,
    zoomAnimation: L.Browser.mobile,
    touchZoom: true,
    tap: true,
    maxZoom: 18,
    minZoom: 11,
    dragging: true,
    maxBounds: L.latLngBounds([60.078534, 24.492334],[60.470071, 25.302576])
  });
  this.focusedJourney = '';
  this.transitive = new Transitive({
    data: this.DATA,
    focusedJourney: '',
    styles:setTransitiveStyles(),
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
  this.transitiveLayer = new L.TransitiveLayer(this.transitive);
  this.oldRoutes = [];
  this.getOldRoutes();
  this.oldRouteData = {};
  this.initializeMapLayers();
  React.render(React.createElement(LeftSidebar, {data: this.DATA}), document.getElementById('sidebar'));
};
App.prototype.getOldRoutes = function() {
  var _this = this;
  $.get('http://matka.hsl.fi/otp/routers/default/index/agencies/HSL/routes/',function(data) {
    _this.oldRoutes = data;
  });
};
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

    // data.journeys = [{
    //   journey_id: 'j_1039_1',
    //   journey_name: 'Pattern: Myjourney',
    //   focus: false,
    //   segments: patterns.map(function(pattern) {
    //     return {
    //       type: 'TRANSIT',
    //       pattern_id: pattern.pattern_id,
    //       from_stop_index: 0,
    //       to_stop_index: (pattern.stops.length - 1)
    //     };
    //   })
    // }];
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
      //this.transitive.focusJourney(this.focusedJourney);
    }
  }
};
App.prototype.setActiveRoutes = function(routeIds){
  this.DATA.routes = this.DATA.routes.map(function(route){
      for(var i = 0; i < routeIds.length; i++) {
        if(routeIds[i] === route.route_id) {
          if(route.active) {
            route.active = false;
          } else {
            route.active = true;
          }
        }
      }
      return route;
    });
  return this.DATA;
};
App.prototype.clearActiveRoutes= function(){
  this.DATA.routes = this.DATA.routes.map(function(route){
    route.active = false;
    return route;
  });
  this.clearRoutesOnMap();
  return this.DATA;
};
App.prototype.clearRoutesOnMap = function() {
  this.transitive.clearData();
  this.map.setView([60.287481, 24.996849], 11);
};
App.prototype.setActiveRoutes = function(routeIds){
  this.DATA.routes = this.DATA.routes.map(function(route){
      for(var i = 0; i < routeIds.length; i++) {
        if(routeIds[i] === route.route_id) {
          if(route.active) {
            route.active = false;
          } else {
            route.active = true;
          }
        }
      }
      return route;
    });
  return this.DATA;
};
App.prototype.renderOldAndNewRoutes = function(data){
    data.routes = data.routes.map(function(route, index) {
      route.route_color = '7f929c';
      return route;
    });
    data.patterns = data.patterns.map(function(pattern, index) {
      pattern.render = (index === 0) ? true : false;
      return pattern;
    });
    var transitiveData = _.clone(this.DATA);
    transitiveData.routes = transitiveData.routes.concat(data.routes);
    transitiveData.stops = transitiveData.stops.concat(data.stops);
    transitiveData.patterns = transitiveData.patterns.concat(data.patterns);
    transitiveData.journeys = [];
    var routeIds = _.where(transitiveData.routes, {active:true}).map(function(route) {
      return route.route_id
    });
    var patterns = _.uniq(_.filter(transitiveData.patterns, function(pattern) {
      if (routeIds.indexOf(pattern.route_id) !== -1) {
        return true;
      } else {
        return false;
      }
    }), 'route_id');

    transitiveData.journeys = patterns.map(function(pattern) {
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
    this.transitive.updateData(transitiveData);
};
App.prototype.openRouteInfo = function(route){
  React.render(React.createElement(RouteInfoModal, {route: route}), document.getElementById('route-info-modal'));
};

App.prototype.initializeMapLayers = function() {
  var _this = this;
  L.tileLayer('http://tulevatreitit.hsl.fi/hsl-map/{z}/{x}/{y}.png', {
    maxZoom: 14,
    minZoom: 11,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
  }).addTo(this.map);
  
  this.map.addLayer(this.transitiveLayer);

  
  this.map.setView([60.287481, 24.996849], 11);
}
