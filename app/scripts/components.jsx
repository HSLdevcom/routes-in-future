var Route = React.createClass({
    openRouteOnMap: function() {
      openRouteMap(this.props.route.route_id);

    },
    render: function() {
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
          <div className='route' onClick={this.openRouteOnMap}>
            {this.props.route.route_short_name} {routeStartText}-{routeStopText}
          </div>
        );
    }
});
var RoutesList = React.createClass({
    render: function() {
        var routes = [];
        routes = this.props.data.routes.map(function(route){
          return <Route route={route} key={route.route_id} />;
        });
        return (
          <div className='routes-list'>
            {routes}
          </div>
        );
    }
});
var RouteCategoryList = React.createClass({
    expandThis: function() {
        this.props.expandCategory(this.props.categoryName);
    },
    render: function() {
        return (
          <div className='vantaa-routes routes accordion'>
            <RoutesList  data={this.props.data}/>
          </div>
        );
    }
});
var AllRoutesList = React.createClass({
    getInitialState: function() {
       return {
           addressSearchText: ''
       };
    },
    render: function() {
        return (
          <div className='routes-group'>
            <RouteCategoryList data={DATA} routeCategory='vantaa'/>
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
        this.setState({suggestionsForFrom:false, suggestionsForTo:false, suggestionsForLine:true});
        var matches = _.where(replacementLines,{oldLines:[e.target.value]});
          this.showSuggestions(matches);
        var newRoutes =  _.map(matches, function(match) {
          return getRoutePattern(_.find(DATA.routes,{route_short_name:match.newLine}).route_id);
        });
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
                        <h3>Korvaavat linjat:</h3>
                        <ul>{suggestionsitems}</ul>;
                      </div>;
      } else {
        var suggestions = '';
      }

        return (
          <div className='route-search-container'>
            <form name='route-search-form'>
              <div className='form-group'>
                <input type='text' className='autocomplete typeahead' onChange={this.search} name='from-place' placeholder='mistä' />
                {this.state.suggestionsForFrom ? suggestions : ''}
              </div>
              <div className='form-group'>
                <input type='text' className='autocomplete typeahead' onChange={this.search} name='to-place' placeholder='mihin' />
                {this.state.suggestionsForTo ? suggestions : ''}
              </div>
              <h2>Tai hae nykyisellä linjanumerolla:</h2>
              <div className='form-group'>
                <input type='text' className='autocomplete typeahead' onChange={this.searchCurrentlines} name='current-linenr' placeholder='nykyinen linjanumero' />
                {this.state.suggestionsForLine ? suggestions : ''}
              </div>
              <button type='submit'>Hae reitti</button>
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
