var Route = React.createClass({
    selectRoute: function(e){
      this.props.selectRoute(this.props.route.route_id);
    },
    render: function() {
        var activeClass = (this.props.route.active)? 'route clearfix active' : 'route clearfix inactive';
        var pattern = _.find(DATA.patterns,{route_id:this.props.route.route_id});
        var routeStartText = _.find(
              DATA.stops,
              { stop_id:pattern.stops[0].stop_id}
        ).stop_name;
        var routeStopText = _.find(
              DATA.stops,
              { stop_id:pattern.stops[pattern.stops.length-1].stop_id}
        ).stop_name;
        return (
          <div className={activeClass} onClick={this.selectRoute}>
            <div className='checkmark'></div>
            <span className='route-nr'>{this.props.route.route_short_name}</span>
            <span className='route-text'>{routeStartText} - {routeStopText}</span>
          </div>
        );
    }
});
var RoutesList = React.createClass({
    selectRoute: function(routeId) {
      this.props.setActiveRoute(routeId);
    },
    render: function() {
        var routes = this.props.routes.map(function(route) {
          return <Route route={route} isActive={route.isActive} selectRoute={this.selectRoute} key={route.route_id} />;
        },this);
        return (
          <div className='routes-list'>
            {routes}
          </div>
        );
    }
});
var AutocompleteInput = React.createClass({
  getInitialState: function() {
    return {
      suggestions: [],
      value: '',
      autocompleteDone: false,
      doNotBlur: false
    };
  },
  search: function(e){
    var _this = this;
    this.setState({value: e.target.value});
    $.get('http://matka.hsl.fi/geocoder/suggest/'+e.target.value)
    .then(function(data) {
      var streets = [];
      if(streets.length === 0 && data.fuzzy_streetnames.length > 0) {
        streets = data.fuzzy_streetnames;
      } else {
        streets = data.streetnames;
      }
      _this.setState({
        suggestions: streets
      });

    });
  },
  setAdress: function(index){

    var suggestions = [];
    var suggestion = this.state.suggestions[index];
    var value = suggestion.key;
    var returnThis = {};
    if(!this.state.suggestions[index].aptNr){
      for(var i = 1; i <= this.state.suggestions[index].doc_count; i++) {
        suggestions.push({key:this.state.suggestions[index].key, aptNr:i});
      }
      this.setState({suggestions:suggestions, value:value, autocompleteDone: false});
    } else {
      value = value +' '+ suggestion.aptNr;
      returnThis = {street: suggestion.key, nr: suggestion.aptNr};
      this.setState({suggestions:[], value:value, autocompleteDone: true, result: returnThis});
    }
    React.findDOMNode(this.refs.theInput).focus();
  },
  setResult: function(e){
    if(!this.state.doNotBlur) {
      React.findDOMNode(this.refs.autocomplete).style.display = 'none';
    }
    if(this.state.autocompleteDone) {
      this.props.setResult(this.state.result,e.target.name);
    }
  },
  showAutocomplete: function(){
    React.findDOMNode(this.refs.autocomplete).style.display = 'block';
  },
  blockHide: function(){
    return this.setState({doNotBlur:true});
  },
  allowHide: function(){
    return this.setState({doNotBlur:false});
  },
  render: function(){
    var autocompleteList;
    var value = this.state.value;
    if(this.state.suggestions.length) {
      var autocompleteListItems = this.state.suggestions.map(function(suggestion,index){
        if(suggestion.aptNr) {
          return <li onClick={this.setAdress.bind(this,index)} key={suggestion.key + index}>{suggestion.key} {suggestion.aptNr}</li>;
        } else {
          return <li onClick={this.setAdress.bind(this,index)} key={suggestion.key + index}>{suggestion.key}</li>;
        }
      },this);
      autocompleteList = <div onMouseEnter={this.blockHide} onMouseLeave={this.allowHide} className='autocomplete-container'>
                          <ul className='autocomplete-list'>
                            {autocompleteListItems}
                          </ul>
                        </div>;
    }
    return (
      <div className='form-group'>
        <input type='text' autoComplete='off' name={this.props.name} ref='theInput' value={value} onFocus={this.showAutocomplete} onBlur={this.setResult} placeholder={this.props.placeholder} onChange={this.search}/>
        <div ref='autocomplete'>{autocompleteList}</div>
      </div>
    );
  }
});
var ReplacementLineSearch = React.createClass({
  getInitialState: function() {
    return {newroutes:[]};
  },
  searchCurrentlines: function(e) {
    e.preventDefault();
    if(e.target.value!=='') {
      var matches = _.where(replacementLines,{oldLines:[e.target.value]});
      var routeInfos = [];
      var routeIds = [];
      var routeInfos =  matches.map(function(match) {
        var routeInfo = _.where(this.props.routes,{route_short_name:match.newLine})[0];
        routeIds.push(routeInfo.route_id);
        return routeInfo;
      },this);
      this.props.setActiveRoutes(routeIds);
      this.setState({newroutes:routeInfos});
    } else {
      this.props.setActiveRoutes([]);
      this.setState({newroutes:[]});
      return clearRoutesOnMap();
    }
  },
  setActiveRoute: function(routeId){
    this.props.setActiveRoute(routeId);
  },
  render: function(){
    var newRoutes;
    if(this.state.newroutes.length){
      newRoutes = <div className='new-routes-replacing'>
                    <h4>Uudet linjat:</h4>
                    <RoutesList setActiveRoute={this.setActiveRoute} routes={this.state.newroutes} />
                  </div>;
    }
    return(
      <form name='line-search-form' onSubmit={this.searchCurrentlines}>
        <h3>Hae nykyisellä linjanumerolla:</h3>
        <div className='form-group'>
          <input autoComplete='off' type='text' onChange={this.searchCurrentlines} name='current-linenr' placeholder='nykyinen linjanumero' />
          {newRoutes}
        </div>
      </form>
    );
  }
});
var RouteSearchBox = React.createClass({
    getInitialState: function() {
       return {
           from: {
             name:'from',
             lat:0,
             lon:0
           },
           to: {
               name:'to',
               lat:0,
               lon:0
           }
       };
    },
    setResult: function(result, type) {
      var _this = this;
      $.get('http://matka.hsl.fi/geocoder/search/'+result.street+'/'+result.nr).then(function(data){
        if(typeof data.hits.hits != 'undefined' && data.hits.hits.length!==0){
          if(type==='from'){
            _this.setState({
              from:{
                name:'from',
                lat:data.hits.hits[0]._source.location[1],
                lon:data.hits.hits[0]._source.location[0]
              }
            });
          } else if(type==='to') {
            _this.setState({
              to:{
                name:'to',
                lat:data.hits.hits[0]._source.location[1],
                lon:data.hits.hits[0]._source.location[0]
              }
            });
          }
          return true;
        } else {
          return false;
        }
      });
    },
    searchRoutes: function(e){
      e.preventDefault();
      var od = {
        from: this.state.from,
        to: this.state.to,
        accessModes: 'WALK'
      };
      var profiler = new OtpProfiler({
        host: 'http://matka.hsl.fi/otp/routers/finland',
        limit: 3 // limit the number of options to profile, defaults to 3
      });
      profiler.journey(od, function(err, data) {
          var profilerTransitive = new Transitive({
            data: data,
            styles:STYLES
          });
          map.addLayer(new L.TransitiveLayer(profilerTransitive));
          map.setView([60.287481, 24.996849], 11);
      });

    },
    render: function() {
      return (
          <form name='route-search-form' onSubmit={this.searchRoutes}>
            <h3>Hae reittiä:</h3>
            <AutocompleteInput  name='from' placeholder='Mistä' setResult={this.setResult}/>
            <AutocompleteInput  name='to' placeholder='Mihin' setResult={this.setResult}/>
            <div className='form-group'>
              <button type='submit'>Hae reitti</button>
            </div>
          </form>
        );
    }
});
var LeftSidebar = React.createClass({
  getInitialState: function(){
    return {DATA:DATA, showAllRoutes:false};
  },
  setActiveRoutes: function(routeIds){
    DATA.routes = DATA.routes.map(function(route){
      route.active = false;
      for(var i = 0; i < routeIds.length; i++) {
        if(routeIds[i] === route.route_id) {
          route.active = true;
        }
      }
      return route;
    });
    // DATA.allPatterns = DATA.allPatterns.map(function(pattern, index) {
    //   pattern.render = false;
    //   for(var i = 0; i < routeIds.length; i++) {
    //     if(routeIds[i] === pattern.route_id) {
    //       pattern.render = true;
    //     }
    //   }
    //
    //   return pattern;
    // });
    this.setState({DATA:DATA});
    showRoutesOnMap();
  },
  setActiveRoute:function(routeId) {
    DATA.routes = DATA.routes.map(function(route){
      if(routeId === route.route_id) {
        if(route.active) {
          route.active = false;
        } else {
          route.active = true;
        }
      }
      return route;
    });
    // DATA.allPatterns = DATA.allPatterns.map(function(pattern, index) {
    //   if(pattern.route_id === routeId) {
    //     if(pattern.render) {
    //       pattern.render = false;
    //     } else {
    //       pattern.render = true;
    //     }
    //   }
    //   return pattern;
    // });
    this.setState({DATA:DATA});
    showRoutesOnMap();
  },
  showAllRoutesList: function() {
    this.setState({showAllRoutes:!this.state.showAllRoutes});
  },
  render: function(){
    var showClass = (this.state.showAllRoutes)?'all-new-routes open':'all-new-routes';
    return (
      <div>
        <RouteSearchBox setActiveRoute={this.setActiveRoute} setActiveRoutes={this.setActiveRoutes} />
        <ReplacementLineSearch routes={DATA.routes} setActiveRoute={this.setActiveRoute} setActiveRoutes={this.setActiveRoutes} />
        <div className={showClass} >
          <h4 onClick={this.showAllRoutesList}>Kaikki uudet linjat</h4>
          <RoutesList setActiveRoute={this.setActiveRoute} routes={DATA.routes} />
        </div>
      </div>
    );
  }
});
React.render(<LeftSidebar data={DATA} />, document.getElementById('sidebar'));
