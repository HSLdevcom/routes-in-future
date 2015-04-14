var Route = React.createClass({
    selectRoute: function(e){
      this.props.selectRoute(this.props.route.route_id);
    },
    render: function() {
        var activeClass = (this.props.route.active)? 'route clearfix active' : 'route clearfix inactive';
        var pattern = _.find(DATA.allPatterns,{route_id:this.props.route.route_id});
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
    getInitialState: function() {
      return {routes:this.props.routes};
    },
    selectRoute: function(rId) {
      var activeRoutes = [];
      var routes = this.state.routes.map(function(route, index) {
        if(route.route_id === rId) {
          if(route.active) {
            route.active = false;
          } else {
            activeRoutes.push(route.route_id);
            route.active = true;
          }
        } else {
          if(route.active) {
            activeRoutes.push(route.route_id);
          }
        }
        return route;
      });

      activeRoutes = activeRoutes.map(function(routeId, index) {
        return getRoutePattern(routeId);
      });

      this.setState({routes: routes});
      return showRoutesOnMap(activeRoutes);
    },
    render: function() {
        var routes = this.state.routes.map(function(route) {
          return <Route route={route} isActive={route.isActive} selectRoute={this.selectRoute} key={route.route_id} />;
        },this);
        return (
          <div className='routes-list'>
            {routes}
          </div>
        );
    }
});
var AllRoutesList = React.createClass({
    render: function() {
        return (
          <div className='routes-group'>
            <h3>Uudet linjat</h3>
            <RoutesList routes={DATA.routes} />
          </div>
        );
    }
});
var RouteSearchBox = React.createClass({
    getInitialState: function() {
       return {
           suggestions: [],
           suggestionsForFrom: false,
           suggestionsForTo: false
       };
    },
    showSuggestions:function(suggestions) {
      this.setState({suggestions:suggestions});

    },
    search: function(e) {
      if(e.target.name==='from-place'){
        this.setState({suggestionsForFrom:true,suggestionsForTo:false,suggestionsForLine:false});

      } else if(e.target.name==='to-place'){
        this.setState({suggestionsForFrom:false,suggestionsForTo:true,suggestionsForLine:false});
      }
      $.get('http://matka.hsl.fi/otp/otp/routers/default/geocode',
            {query:e.target.value}).then(this.showSuggestions);
    },
    searchCurrentlines: function(e) {
      if(e.target.value!=='') {
        var matches = _.where(replacementLines,{oldLines:[e.target.value]});
        var newRoutes =  _.map(matches, function(match) {
          return getRoutePattern(_.find(DATA.routes,{route_short_name:match.newLine}).route_id);
        });
        this.setState({suggestionsForFrom:false, suggestionsForTo:false, suggestionsForLine:true});
        this.showSuggestions(matches);
        return showRoutesOnMap(newRoutes);
      } else {
        return clearRoutesOnMap();
      }
    },
    render: function() {

      var suggestions;
      if (this.state.suggestions && !this.state.suggestionsForLine) {
        suggestionsitems = this.state.suggestions.map(function(suggestion,index){
          return <li key={suggestion.id}>{suggestion.description}</li>;
        });
        suggestions = <ul>{suggestionsitems}</ul>;
      } else if(this.state.suggestions && this.state.suggestionsForLine) {
        suggestionsitems = this.state.suggestions.map(function(suggestion,index){
          return <li key={suggestion.newLine}>{suggestion.newLine}</li>;
        });
        suggestions = <div className='suggestions'>
                        <h4>Korvaavat linjat:</h4>
                        <ul>{suggestionsitems}</ul>
                      </div>;
      } else {
        var suggestions = '';
      }

        return (
          <div className='route-search-container'>
            <form name='route-search-form'>
              <h3>Hae reittiä:</h3>
              <div className='form-group'>
                <input type='text' className='autocomplete typeahead' onChange={this.search} name='from-place' placeholder='mistä' />
                {this.state.suggestionsForFrom ? suggestions : ''}
              </div>
              <div className='form-group'>
                <input type='text' className='autocomplete typeahead' onChange={this.search} name='to-place' placeholder='mihin' />
                {this.state.suggestionsForTo ? suggestions : ''}
              </div>
              <h3>Hae nykyisellä linjanumerolla:</h3>
              <div className='form-group'>
                <input type='text' className='autocomplete typeahead' onChange={this.searchCurrentlines} name='current-linenr' placeholder='nykyinen linjanumero' />
                {this.state.suggestionsForLine ? suggestions : ''}
              </div>
              <div className='form-group'>
                <button type='submit'>Hae reitti</button>
              </div>
            </form>
          </div>
        );
    }
});
var LeftSidebar = React.createClass({
  render: function(){
    return (
      <div>
        <RouteSearchBox />
        <AllRoutesList data={DATA} />
      </div>
    );
  }
});
React.render(<LeftSidebar data={DATA} />, document.getElementById('sidebar'));
