function App() {
  React.initializeTouchEvents(true);
  var _this = this;
  this.DATA = DATA;
  var route_ids = [];
  var pats = [];
  for (var i = 0; i < this.DATA.routes.length; i++) {
    pats.push(_.where(this.DATA.patterns,{pattern_id: this.DATA.routes[i].route_id+'_1'}));
  }
  this.DATA.patterns = _.flatten(pats);
  this.map =  L.map('map', {
    inertia: false,
    zoomAnimation: L.Browser.mobile,
    touchZoom: true,
    tap: true,
    maxZoom: 18,
    minZoom: 11,
    dragging: true,
    maxBounds: L.latLngBounds([60.078534, 24.492334], [60.470071, 25.302576])
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
      angleConstraint: 22.5, //22.5
      mergeVertexThreshold: 200
    }, {
      minScale: 1.5,
      gridCellSize: 0,
      internalVertexFactor: 0,
      angleConstraint: 5,
      mergeVertexThreshold: 0
    }]
  });
  //¨this.transitive.setRenderer('wireframe')
  this.transitiveLayer = new L.TransitiveLayer(this.transitive);
  this.oldRoutes = [];
  this.getOldRoutes();
  this.oldRouteData = {};
  this.initializeMapLayers();
  React.render(React.createElement(LeftSidebar, {data: this.DATA}), document.getElementById('sidebar'));
};
App.prototype.getOldRoutes = function() {
  var _this = this;
  $.get('http://matka.hsl.fi/otp/routers/default/index/agencies/HSL/routes/', function(data) {
    _this.oldRoutes = data;
  });
};
var network = {
  startStops: {},
  allStops:{},
  stopStops:{}
};
function addToNetwork(from,to,pattern_id) {
  if(network.allStops[from]){
    if(network.allStops[from][to]){
      network.allStops[from][to].push(pattern_id);
    } else {
      network.allStops[from][to] = [pattern_id];
    }
  } else {
      network.allStops[from] = {};
      if(network.allStops[from][to]){
        network.allStops[from][to].push(pattern_id);
      } else {
        network.allStops[from][to] = [pattern_id];
      }
  }
}
function samePatterns(p1,p2) {
  var t1 = [];
  var t2 = [];
  for (var i = p1.length - 1; i >= 0; i--) {
    t1.push(p1[i].pid);
  };
  for (var i = p2.length - 1; i >= 0; i--) {
    t2.push(p2[i].pid);
  };
  for (var i = t1.length - 1; i >= 0; i--) {
    if(t2.indexOf(t1[i])===-1){
      return false;
    }
  }
  return true;
}
var junctions = {};

function findJunctionsAlongPattern(stop_id, pattern){
    var stops = Object.keys(network.allStops[stop_id]);
    var next;
    for (var i = stops.length - 1; i >= 0; i--) {

      next = stops[i];
      if(next !=='end' && next!=='start' && _.where(network.allStops[stop_id][stops[i]],{pid:pattern.pid}).length!==0) {

        var nextStops = Object.keys(network.allStops[next]);
        var found = true;
        for (var x = nextStops.length - 1; x >= 0; x--) {

          if(_.where(network.allStops[stops[i]][nextStops[x]],{pid:pattern.pid}).length!==0) {
            if(network.allStops[stop_id][stops[i]].length===network.allStops[stops[i]][nextStops[x]].length) {

              if(!samePatterns(network.allStops[stop_id][stops[i]],network.allStops[stops[i]][nextStops[x]])) {

                if(!junctions[stop_id]){
                  junctions[stop_id] = [];
                }

                var patterns = _.where(network.allStops[stops[i]][nextStops[x]],{pid:pattern.pid});
                for (var y = patterns.length - 1; y >= 0; y--) {
                  junctions[stop_id].push(patterns[y]);
                }
              }
            }
          } else {
            found = false;
          }
        }
        if(found===false) {
          if(!junctions[stops[i]]){
              junctions[stops[i]] = [];
          }
          var patterns = _.where(network.allStops[stop_id][stops[i]],{pid:pattern.pid});
          for (var y= patterns.length - 1; y >= 0; y--) {
            junctions[stops[i]].push(patterns[y]);
          }
        }
      }
    }
    if(next && next!=='end'){
      return findJunctionsAlongPattern(next, pattern)

    }
}
function createStartStops (network) {
  network.startStops = {};
  network.stopStops = {};
  junctions = {};
  _.forEach(network.allStops,function(stop,stop_id){
    if(stop.start) {
      if(!network.startStops[stop_id]) {
        network.startStops[stop_id] = {};
      }
      network.startStops[stop_id].start = stop.start;
      if(!junctions[stop_id]){
          junctions[stop_id] = [];
      }
      junctions[stop_id] = junctions[stop_id].concat(stop.start);
    }
    if(stop.end) {
      if(!junctions[stop_id]){
          junctions[stop_id] = [];
      }
      junctions[stop_id] = junctions[stop_id].concat(stop.end);
    }
  });
  _.forEach(network.startStops,function(stop,stop_id){
    _.forEach(stop.start,function(pattern){
      findJunctionsAlongPattern(stop_id,pattern);
    });
  });
}
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
    network.allStops = {};
    patterns.forEach(function(p){
      p.stops.forEach(function(s,index){
        if(index===0) {
          addToNetwork(s.stop_id,'start',{pid: p.pattern_id,index: index})
        }
        if(index===p.stops.length-1){
          addToNetwork(s.stop_id,'end',{pid: p.pattern_id,index: index});
        } else {
          addToNetwork(s.stop_id,p.stops[index+1].stop_id,{pid: p.pattern_id,index: index+1});
        }
      });
    });
    //createStartStops(network);
    var thing = [];
    _.forEach(junctions,function(value, key){
      var segments = [];
      for (var i = 0; i < value.length; i++) {
        if(i<value.length-1) {
          segments.push({
            type: 'TRANSIT',
            pattern_id: key,
            from_stop_index: value[i],
            to_stop_index: value[i+1]
          });
        }
      }
      thing.push({
        journey_id: 'j_' + key,
        journey_name: 'Pattern:' + key,
        focus: false,
        segments:segments
      })
    });
    var oldstyle = patterns.map(function(pattern) {
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
    data.journeys = oldstyle;

  }

  if (type === 'new' || type === 'routesearch') {
    this.transitive.updateData(data);
    if (typeof data.journeys !== 'undefined' && data.journeys.length) {
      this.map.fitBounds(this.transitiveLayer.getBounds());
    } else {
      this.map.setView([60.287481, 24.996849], 11);
    }

    if (type === 'routesearch') {
      //this.transitive.focusJourney(this.focusedJourney);
    }
  }
};
App.prototype.setActiveRoutes = function(routeIds) { 
  var activeRouteIds = [];
  this.DATA.routes = this.DATA.routes.map(function(route) {
      for (var i = 0; i < routeIds.length; i++) {
        if (routeIds[i] === route.route_id) {
          if (route.active) {
            route.active = false;
          } else {
            route.active = true;
          }
        }
      }

      if (route.active) activeRouteIds.push(route.route_id);
      return route;
    });
  return this.DATA;
};
App.prototype.clearActiveRoutes = function() {
  this.DATA.routes = this.DATA.routes.map(function(route) {
    route.active = false;
    return route;
  });
  this.DATA.patterns = this.DATA.patterns.map(function(pattern) {
    pattern.render = false;
    return pattern;
  });
  this.clearRoutesOnMap();
  return this.DATA;
};
App.prototype.clearRoutesOnMap = function() {
  this.transitive.clearData();
  this.map.setView([60.287481, 24.996849], 11);
};
App.prototype.renderOldAndNewRoutes = function(data) {
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
App.prototype.openRouteInfo = function(route) {
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
