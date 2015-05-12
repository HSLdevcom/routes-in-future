var Icon = React.createClass({
  propTypes: {
    img: React.PropTypes.string.isRequired
  },
  render: function() {

    var clazz = '';
    if (this.props.className) {

      clazz = this.props.className;
    }

    var id = '';
    if (this.props.id){
      id = 'id=' + this.props.id + ' '; // Adding the space here, as otherwise it leads to different number of spaceis in server-side vs client-side html due to minification
    }
    var fill = '';
    if (this.props.fill){
      fill = '#' + this.props.fill;
    }

    var html = '<svg '+id+' viewBox="0 0 40 40" class="icon '+clazz+'" fill="'+fill+'">'+
                  '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#'+this.props.img+'"></use>'+
               '</svg>';
    return (<span dangerouslySetInnerHTML={{__html: html}} />);
  }
});
var Route = React.createClass({
    selectRoute: function(e){
      e.stopPropagation();

      this.props.selectRoute(this.props.route.route_id);
    },
    openRouteInfo: function(e){
      app.openRouteInfo(this.props.route);
    },
    render: function() {
        var classes = (this.props.route.active)? 'route clearfix active ' : 'route clearfix inactive ';
        var icon;
        var routeInfoBtn; 
        if(typeof ROUTEINFO[this.props.route.route_short_name]!=='undefined'){
          routeInfoBtn = <div className='open-route-info' onClick={this.openRouteInfo}>i</div>;
        } 
        if(this.props.route.route_type===3) {
          classes+= 'bus';
          icon = <Icon img='icon-icon_bus'/>
        }
        var pattern = _.find(DATA.patterns,{route_id:this.props.route.route_id});
        var routeStartText = _.find(
              DATA.stops,
              { stop_id:pattern.stops[0].stop_id}
        ).stop_name;
        var routeStopText = _.find(
              DATA.stops,
              { stop_id:pattern.stops[pattern.stops.length-1].stop_id}
        ).stop_name;
        var routeText = routeStartText+' - '+routeStopText;
        return (
          <div className={classes} >
            <div className='checkmark-icon-nr' onClick={this.selectRoute}>
              <div className='checkmark'></div>
              {icon}
              <div className='route-nr'>{this.props.route.route_short_name}</div>
            </div>
            <div className='route-text'>{routeText}</div>
            {routeInfoBtn}
          </div>
        );
    }
});
var RoutesList = React.createClass({
    selectRoute: function(routeId) {
      this.props.setActiveRoutes([routeId]);
    },
    render: function() {
        var style = {};
        var routes = this.props.routes.map(function(route) {
          return <Route route={route} isActive={route.isActive} selectRoute={this.selectRoute} key={route.route_short_name} />;
        },this);
        if(this.props.height) {
          style.maxHeight = this.props.height+'px';
        }
        
        return (
          <div className='routes-list' style={style}>
            {routes}
          </div>
        );
    }
});
var AutocompleteInput = React.createClass({
  getInitialState: function() {
    return {
      suggestions: [],
      activeSuggestionIndex: 0,
      value: '',
      autocompleteDone: false,
      doNotBlur: false
    };
  },
  componentWillReceiveProps: function(newProps) {
    if(newProps.cleared !== this.props.cleared) {
      this.setState({value:''});
    }
  },
  search: function(e){
    var _this = this;
    this.setState({value: e.target.value});
    $.get('http://tulevatreitit.hsl.fi/geocoder/suggest/'+e.target.value)
    .then(function(data) {
      var suggestions = [];
      var city = {};
      for (var i = 0; i < data.streetnames_fi.length; i++) {
        city.type = 'street';
        _.forEach(data.streetnames_fi[i], function (obj, streetname) {
          obj.forEach(function (city) {
            city.type = 'street';
            city['name'] = streetname
            city['key'] = city.key.charAt(0).toUpperCase() + city.key.slice(1);
            city['suggestionText'] = streetname+ ', ' +city.key.charAt(0).toUpperCase() + city.key.slice(1);
            suggestions.push(city);
          });
        });
      }

      data.stops.forEach(function (stop) {
        stop.type = 'stop';

        stop.suggestionText = stop.stop_name + ' (' + stop.stop_code + ')';
        suggestions.push(stop)
        
      });
      suggestions.sort(function(a,b){
        if(a.type === 'street' && b.type === 'street') {
          if(a.suggestionText > b.suggestionText){
            return 1;
          } else if(a.suggestionText < b.suggestionText) {
            return -1;
          } else {
            return 0;
          }
        } else if(a.type === 'stop' && b.type === 'stop'){
          if(a.suggestionText > b.suggestionText){
            return 1;
          } else if(a.suggestionText < b.suggestionText) {
            return -1;
          } else {
            return 0;
          }
        } else if(a.type === 'street' && b.type === 'stop'){
            return -1;
        } else if(a.type === 'stop' && b.type === 'street'){
            return 1;
        }
      });
      _this.setState({
        suggestions: suggestions,
        activeSuggestionIndex: 0
      });

    });
  },
  setAdress: function(index){
    var suggestion = this.state.suggestions[index];
    var value = this.state.suggestions[index].suggestionText;
    if (suggestion.stop_name) {
      returnThis = {'lon': suggestion.location[0], 'lat': suggestion.location[1], name: value}
      if(suggestion.zone_id==4){
       returnThis.city = 'Vantaa'; 
      } else {
       returnThis.city = '0';  
      }
      this.setState({suggestions:[], value:value, autocompleteDone: true, result: returnThis,activeSuggestionIndex: 0});
    } else if (suggestion.key && suggestion.name) {
      $.get('http://tulevatreitit.hsl.fi/geocoder/search/'+suggestion.key+'/'+suggestion.name).then(function(data){
        if (data.results.length === 1) {
          var result = data.results[0];
          var name = result.katunimi + (result.osoitenumero == 0 ? "": " " + result.osoitenumero ) + ', ' + result.kaupunki;
          returnThis = {'lon': data.results[0].location[0], 'lat': data.results[0].location[1], name: name}
          if(result.kaupunki=='Vantaa'){
           returnThis.city = 'Vantaa'; 
          } else {
           returnThis.city = '0';  
          }
          this.setState({suggestions:[], value:name, autocompleteDone: true, result: returnThis,activeSuggestionIndex: 0});
        } else {
          var suggestions = []
          var results = _.sortBy(data.results, 'osoitenumero');
          results.forEach(function (result) {
            result.suggestionText = result.katunimi+' '+result.osoitenumero+result.kiinteiston_jakokirjain+', '+result.kaupunki;
            suggestions.push(result)
          });
          this.setState({suggestions:suggestions, value:value, autocompleteDone: false,activeSuggestionIndex: 0});
        }
      }.bind(this));
    } else if (suggestion.location) {
      var name = suggestion.katunimi + (suggestion.osoitenumero == 0 ? "": " " + suggestion.osoitenumero ) + ', ' + suggestion.kaupunki;
      returnThis = {'lon': suggestion.location[0], 'lat': suggestion.location[1], name: name}
      if(suggestion.kaupunki=='Vantaa'){
       returnThis.city = 'Vantaa'; 
      } else {
       returnThis.city = '0';  
      }

      this.setState({suggestions:[], value:name, autocompleteDone: true, result: returnThis,activeSuggestionIndex: 0});
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
  showAutocomplete: function() {
    React.findDOMNode(this.refs.autocomplete).style.display = 'block';
  },
  blockHide: function() {
    return this.setState({doNotBlur:true});
  },
  allowHide: function() {
    return this.setState({doNotBlur:false});
  },
  onKeyDown: function(e) {
    if(e.keyCode === 38) {
      if(this.activeSuggestionIndex>0){
        this.setState({activeSuggestionIndex: (this.state.activeSuggestionIndex-1)});
      }
    } else if(e.keyCode === 40) {
      if(this.activeSuggestionIndex <=(this.state.suggestions.length-2) ){
        this.setState({activeSuggestionIndex: (this.state.activeSuggestionIndex+1)});
      }
    }
  },
  render: function() {
    var autocompleteList;
    var value = this.state.value;
    if(Object.keys(this.state.suggestions).length) {
      var autocompleteListItems = this.state.suggestions.map(function(suggestion,index){
        var clazz = (index === this.state.activeSuggestionIndex)? 'active': '';
        if(suggestion.osoitenumero) {
          return <li className={clazz} onClick={this.setAdress.bind(this,index)} key={suggestion.suggestionText}>{suggestion.suggestionText}</li>;
        } else if(typeof suggestion.stop_name!=='undefined') {
          return <li className={clazz} onClick={this.setAdress.bind(this,index)} key={suggestion.stop_id}>{suggestion.suggestionText}</li>;
        } else {
          return <li className={clazz} onClick={this.setAdress.bind(this,index)} key={suggestion.suggestionText}>{suggestion.suggestionText}</li>;
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
        <input type='text' autoComplete='off' onKeyDown={this.onKeyDown} name={this.props.name} ref='theInput' value={value} onFocus={this.showAutocomplete} onBlur={this.setResult} placeholder={this.props.placeholder} onChange={this.search}/>
        <div ref='autocomplete'>{autocompleteList}</div>
      </div>
    );
  }
});
var RouteSearchBox = React.createClass({
    getInitialState: function() {
       return {
          focusedIndex: 0,
          cantSearch: false,
          cleared: false,
          showError: false,
          searchResults:[],
          transitivedata:[],
          linkDaymonthyear:'26.08.2015',
          linkHour:'08',
          from: {
            name: 'from',
            city: '',
            lat:0,
            lon:0
          },
          to: {
            name:'to',
            city: '',
            lat:0,
            lon:0
          }
       };
    },
    setResult: function(result, type) {
      if(type==='from'){
        this.setState({
          from:result
        });
      } else if(type==='to') {
        this.setState({
          to:result
        });
      }
      return true;
    },
    searchRoutes: function(e){
      e.preventDefault();
      if(this.state.from.city !== 'Vantaa' && this.state.to.city !=='Vantaa') {
        this.setState({cantSearch: true, searchResults: []});
        return this.props.clearActiveRoutes('route');
      } else {
        var startTime = '07:00';
        var endTime = '11:00';
        var profileDate = '2015-08-26';
        var inputTimeofDay = React.findDOMNode(this.refs.theTime).value; 
        var inputDayOfTheWeek = React.findDOMNode(this.refs.theDay).value; 
        var maxWalkTime = 20;
        var linkDaymonthyear = '26.08.2015';
        var linkHour = '08';
        if(inputTimeofDay === 'morning') {
          linkHour = '08';
          startTime = '07:00';
          endTime = '09:00';
        } else if (inputTimeofDay === 'day'){
          linkHour = '13';
          startTime = '12:00';
          endTime = '14:00';
        } else if (inputTimeofDay === 'afternoon'){
          linkHour = '17';
          startTime = '16:00';
          endTime = '18:00';
        } else if (inputTimeofDay === 'evening'){
          linkHour = '21';
          startTime = '18:00';
          endTime = '20:00';
        } else if (inputTimeofDay === 'night'){
          linkHour = '01';
          startTime = '22:00';
          endTime = '23:59';
          maxWalkTime = 45;
        }

        if(inputDayOfTheWeek === 'weekday') {
          linkDaymonthyear = '26.08.2015';
          profileDate = '2015-08-26';
        } else if (inputTimeofDay === 'saturday'){
          linkDaymonthyear = '29.08.2015';
          profileDate = '2015-08-29';
        } else if (inputTimeofDay === 'sunday'){
          linkDaymonthyear = '30.08.2015';
          profileDate = '2015-08-30';
        }
        
        this.setState({cantSearch: false, linkHour: linkHour, linkDaymonthyear: linkDaymonthyear});
        this.props.clearActiveRoutes('route');
        var _this = this;
        var od = {
          from: this.state.from,
          to: this.state.to,
          accessModes: 'WALK',
          egressModes: 'WALK',
          startTime: startTime,
          endTime: endTime,
          maxWalkTime: maxWalkTime,
          bikeTime: 0,
          bikeSafe: 0,
          directModes: '',
          suboptimal: 0,
          transitModes: 'TRANSIT',
          date: profileDate
        };
        var profiler = new OtpProfiler({
          host: 'http://tulevatreitit.hsl.fi/otp/routers/helsinki',
          limit: 5
        });
        profiler.profile(od, function(err, data) {
          var valid = [];
          var seen = [];
          var sorted = data.options.sort(function (a, b) {return(a.stats.avg-b.stats.avg)});
          sorted.map(function(option){
            var option = option;
            if(typeof option.transit!=='undefined') {
              if (!_.includes(seen, option.summary.split("via")[0])){
                seen.push(option.summary.split("via")[0]);
                valid.push(option);
              }
            }
          });
          var validObj = {
            options: valid
          }

          if(err===null && valid.length){

            od.profile = validObj;
            profiler.journey(od,function(err,transitivedata) {
              _this.setState({searchResults : valid, showError: (valid.length)?false : true});
              app.showRoutesOnMap(transitivedata,'routesearch');
              app.transitive.options.focusedJourney = '0_transit';
              app.transitive.focusJourney('0_transit');
              
            });

          }

        });
      }
    },
    clearSearch: function(){
      this.props.clearActiveRoutes('route');
      this.setState({searchResults : [], cleared: !this.state.cleared, cantSearch: false});
    },
    focusJourney: function(index){
      var journeyId = index+'_transit'
      app.transitive.options.focusedJourney = journeyId;
      app.transitive.focusJourney(journeyId);
      this.setState({focusedIndex: index});
    },
    render: function() {
      var resultContent, errorContent;
      if(this.state.searchResults.length) {
        var style = {};
        var results;
        if(this.props.listHeight) {
          style.maxHeight = this.props.listHeight+'px';
        }
        results = this.state.searchResults.map(function(result, index) {
          if(result.summary!=='Non-transit options') {
            var focused = (this.state.focusedIndex === index); 
            var clazz = (this.state.focusedIndex === index)? 'result focused': 'result';
            var walkTime = Math.floor((result.access.reduce(function(a,b){
              return {time: a.time + b.time};
              }).time + result.egress.reduce(function(a,b){
              return {time: a.time + b.time};
              }).time + result.transit.reduce(function(a,b){
              return {walkTime: a.walkTime + b.walkTime};
              }).walkTime)/60) + ' min. kävelyä';
            
            var time = <div className='time'>
                          <div className='total-time'>
                            <h3>
                              {Math.floor(result.stats.min/60)} - 
                              {Math.floor((result.stats.max-result.transit[0].waitStats.max)/60)} min.
                            </h3>
                          </div>
                          <div className='walk-time'>
                            <h4>{walkTime} </h4>
                          </div>
                        </div>;
            
            var routes =  result.transit.map(function(transit){
                            var from;
                            var to;
                            if(focused) {
                              from = transit.fromName.charAt(0) + transit.fromName.slice(1).toLowerCase();
                              to = transit.toName.charAt(0) + transit.toName.slice(1).toLowerCase();                
                            }
                            return (
                              <div>
                                <div className='access-transit-egress'>
                                  <h5 className='from'>{from}</h5>
                                  <div className='result-routes'>
                                    {transit.routes.map(function(route,index){
                                      var clazz = 'result-route ' + route.mode;
                                      var icon;
                                      if(route.mode ==='BUS') {
                                        icon = <Icon img='icon-icon_bus'/>;
                                      } else if(route.mode === 'TRAM') {
                                        icon = <Icon img='icon-icon_tram'/>;
                                      } else if(route.mode === 'RAIL') {
                                        icon = <Icon img='icon-icon_rail'/>;
                                      } else if(route.mode === 'SUBWAY') {
                                        icon = <Icon img='icon-icon_subway'/>;
                                      } else if(route.mode === 'FERRY') {
                                        icon = <Icon img='icon-icon_ferry'/>;
                                      }
                                      var key = 'resultroute'+index;
                                      if(typeof route.shortName==='undefined') route.shortName = 'Metro';
                                      var txt = (index===(transit.routes.length-1))? route.shortName : route.shortName+' /';
                                      if(index<3 || focused){
                                        return <h4 className={clazz} key={key}>{icon}{txt}</h4>;
                                      } else if(index===7) {
                                        return <h4 className={clazz} key={key}>...</h4>;
                                      }
                                    })}
                                    <h4 className='avg-time'>{Math.floor(120/transit.rideStats.num)} min. välein</h4>
                                  </div>
                                  <h5 className='to'>{to}</h5>
                                </div>
                                <Icon img='icon-icon_walk' className='walk'fill='999'/>
                              </div>
                            );
                          });
            var from = <h5>{this.state.from.name}</h5>;
            var to = <h5>{this.state.to.name}</h5>;
            return (<div className={clazz} onClick={this.focusJourney.bind(this,index)} >
                      {from}
                      <Icon img='icon-icon_walk' className='walk' fill='999'/>
                      {routes}
                      {to}
                      {time}
                    </div>);

          } else {
            return '';
          }

        },this);
        resultContent = <div className='result-content'>
          <h4 className='pre-heading'>Uudet reittivaihtoehtosi alkaen 10.8.2015</h4>
          <div onClick={this.clearSearch}>
            <Icon img='icon-icon_close' className='close' fill='000'/>
          </div>
          <div className='search-results' style={style}>
            {results}
          </div>
        </div>;
      } 
      if(this.state.cantSearch && this.props.isOpen) {
        var href= 'http://www.reittiopas.fi?from_in='+this.state.from.name+'&to_in='+this.state.to.name+'&when=now&timetype=departure&hour='+this.state.linkHour+'&minute=00&daymonthyear='+this.state.linkDaymonthyear;
        errorContent =  <div className='error'>
                          <p>
                            Kumpikaan osoitteista ei ole muutosalueella
                          </p>
                          <p>
                            <a href={href} target='_blank'>Katso tämä reitti Reittioppaasta</a>
                          </p>
                        </div>;
      } 
      if(this.state.showError && this.props.isOpen){
        var href= 'http://www.reittiopas.fi?from_in='+this.state.from.name+'&to_in='+this.state.to.name+'&when=now&timetype=departure&hour='+this.state.linkHour+'&minute=00&daymonthyear='+this.state.linkDaymonthyear;
        errorContent =  <div className='error'>
                    <h4>Ei hakutuloksia</h4>
                    <p>
                      <a href={href} target='_blank'>Katso tämä reitti Reittioppaasta</a>
                    </p>
                  </div>;
      }
    
      return (
          <div className='route-search-form'>
            <form name='route-search-form'  className='route-form' onSubmit={this.searchRoutes}>
              <h3>Katso, muuttuuko reittisi.</h3>
              <AutocompleteInput cleared={this.state.cleared} name='from' placeholder='Mistä?' setResult={this.setResult}/>
              <AutocompleteInput cleared={this.state.cleared} name='to' placeholder='Mihin?' setResult={this.setResult}/>
              <div className='form-group'>
                <select className='select-box' ref='theDay' name='the-day'>
                  <option value='weekday'>Arkipäivä</option>
                  <option value='saturday'>Lauantai</option>
                  <option value='sunday'>Sunnuntai</option>
                </select>                
                <select className='select-box' ref='theTime' name='the-time'>
                  <option value='morning'>Aamu</option>
                  <option value='day'>Päivä</option>
                  <option value='afternoon'>Iltapäivä</option>
                  <option value='evening'>Ilta</option>
                  <option value='night'>Yö</option>
                </select>
                <button ref='theSumbitBtn' type='submit'>Hae</button>
              </div>
            </form>
              {errorContent}
              {resultContent}
          </div>
        );
    }
});
var ReplacementLineSearch = React.createClass({
  getInitialState: function() {
    return {newroutes: [], showAllRoutes: false, searching: false, showError: false};
  },
  searchCurrentlines: function(e) {
    e.preventDefault();
    this.props.setActiveRoutes([]);
    var value = React.findDOMNode(this.refs.theLineNr).value;
    var _this = this;
    this.props.clearActiveRoutes('line'); 
    if(value!=='') {
      var oldLineId;
      var matches = _.filter(replacementLines,function(line){
        if(line.oldLines.indexOf(value)!==-1) return true;
      });
      if(matches.length>0){
        var routeInfos = [];
        var routeIds = [];
        var transitiveData = [];
        var routeInfos =  matches.map(function(match) {
          var routeInfo = _.where(this.props.routes,{route_short_name:match.newLine})[0];
          routeIds.push(routeInfo.route_id);
          return routeInfo;
        },this);
        if(this.props.setActiveRoutes(routeIds)) {
          this.setState({newroutes: routeInfos, showAllRoutes: false, searching: true, showError: false});

          oldRoute = _.find(app.oldRoutes,{shortName:value});
          var oldRoutes = [];
          oldRoutes.push(oldRoute);
          new ConstructTransitiveData(oldRoutes,'http://matka.hsl.fi/otp/routers/default/index/',function(data){
            app.oldRouteData = data;
              app.renderOldAndNewRoutes(app.oldRouteData);
             _this.setState({searching: false});
          });
        }
      } else {
        this.setState({showError: true, newroutes: [], showAllRoutes: false, searching: false});
      } 
    }
  },
  showAllNewRoutes: function(e) {
    e.preventDefault();
    if(!this.state.searching) {
      React.findDOMNode(this.refs.theLineNr).value = '';
      this.props.clearActiveRoutes('line');
      if(this.state.showAllRoutes) {
        this.setState({newroutes: [], showAllRoutes: false, showError: false});
      } else {
        this.setState({newroutes: this.props.routes, showAllRoutes: true, showError: false});
      }
      
    }
  },
  setActiveRoutes: function(routeIds){
    if(this.props.setActiveRoutes(routeIds)) {
      if(this.state.showAllRoutes){
        app.showRoutesOnMap(app.DATA,'new');
      } else {
        app.renderOldAndNewRoutes(app.oldRouteData);
      }
    }
  },
  clearSearch: function(){
      React.findDOMNode(this.refs.theLineNr).value = '';
      this.props.clearActiveRoutes('line');
      this.setState({newroutes: [], showAllRoutes: false, searching: false, showError: false});
  },
  render: function() {
    var routes;
    var errors;
    if(this.state.newroutes.length && this.props.isOpen) {
      var heading = '';

      if(!this.state.showAllRoutes) {
        heading = <h4 className='pre-heading'>Korvaavat linjat alkaen 10.8.2015</h4>;
      }

      routes = <div className='new-routes'>
                  <div onClick={this.clearSearch}>
                      <Icon img='icon-icon_close' className='close' fill='000'/>
                  </div>
                  {heading}
                  <RoutesList height={this.props.listHeight} setActiveRoutes={this.setActiveRoutes} routes={this.state.newroutes} />
                </div>;
    } 
    if(this.state.showError && this.props.isOpen){
      errors =  <div className='error'>
                  <div onClick={this.clearSearch}>
                      <Icon img='icon-icon_close' className='close' fill='000'/>
                  </div>
                  <p>Ei hakutuloksia</p>
                  <p>
                    Voit hakea reittisi <a href='http://www.reittiopas.fi' target='_blank'>reittioppaasta</a>
                  </p>
                </div>;
    }
    

    return(
      <div className='line-search-form'>
        <form className='line-form' name='line-search-form'  onSubmit={this.searchCurrentlines}>
          <h3>Katso tulevat linjasi:</h3>
          <div className='form-group'>
            <input autoComplete='off' type='text' ref='theLineNr' name='current-linenr' placeholder='Nykyinen linjanumero' />
            <button type='submit'>Hae</button>
          </div>
          <a href='#show-all-new' onClick={this.showAllNewRoutes}>{(this.state.showAllRoutes && this.props.isOpen)? 'Piillota kaikki uudet linjat' :'Näytä kaikki uudet linjat'} <small>&gt;</small></a>
        </form>
        
        {routes}
        {errors}
      </div>
    );
  }
});

var LeftSidebar = React.createClass({
  getInitialState: function(){
    return {DATA:this.props.data,listHeight: 0, open: 'route'};
  },
  clearActiveRoutes: function(searchToShow){
    this.setState({DATA:app.clearActiveRoutes(), open: searchToShow});
  },
  setActiveRoutes:function(routeIds) {
    var DATA = app.setActiveRoutes(routeIds);
    this.setState({DATA:DATA});
    return true;
  },
  handleResize: function(e) {
    var listHeight = document.querySelectorAll('.route-form')[0].offsetHeight;
    listHeight += document.querySelectorAll('.line-form')[0].offsetHeight;
    listHeight += document.querySelectorAll('.info')[0].offsetHeight;
    listHeight += document.querySelectorAll('.footer')[0].offsetHeight;
    listHeight += 100;
    if(listHeight>window.innerHeight){
      document.getElementsByClassName('left-sidebar')[0].style.overflow = 'auto';
      listHeight = 100;
    } else {
      document.getElementsByClassName('left-sidebar')[0].style.overflow = 'hidden';
      listHeight = window.innerHeight -listHeight;
    }
    this.setState({listHeight:listHeight});
  },
  componentDidMount: function() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  },

  componentWillUnmount: function() {
    window.removeEventListener('resize', this.handleResize);
  },
  render: function(){
    return (
      <div className="sidebar-inner">
        <RouteSearchBox 
          isOpen={(this.state.open==='route')?true:false}
          listHeight={this.state.listHeight} 
          clearActiveRoutes={this.clearActiveRoutes} 
          updateHeight={this.handleResize} 
          listHeight={this.state.listHeight} 
          setActiveRoutes={this.setActiveRoutes} />
        <ReplacementLineSearch
          isOpen={(this.state.open==='line')?true:false}
          listHeight={this.state.listHeight} 
          setActiveRoutes={this.setActiveRoutes} 
          clearActiveRoutes={this.clearActiveRoutes} 
          routes={this.state.DATA.routes} />
      </div>
    );
  }
});
var RouteInfoModal = React.createClass({
  closeModal: function(){
    $('#route-info-modal').removeClass('open');
  },
  componentDidMount: function(){
    $('#route-info-modal').addClass('open');
  },
  componentWillUpdate: function(){
    $('#route-info-modal').addClass('open');
  },
  render: function(){
    var routeInfo = ROUTEINFO[this.props.route.route_short_name];
    var table;
    var timeRow;
    var scheduleRow;
    var schedule = [];
    if(routeInfo.specialSchedule) {
      var hours = [];
      for (var i = 0; i < routeInfo.scheduleHours.length; i++) {
        hours.push(<td key={this.props.route.route_short_name + '-schedulehours-' + i} dangerouslySetInnerHTML={{__html:routeInfo.scheduleHours[i]}} />);
      }
      timeRow = <tr className='time-row'>
                <td>Linja</td>
                {hours}
                </tr>;
    }
    for (var i = 0; i < routeInfo.schedule.length; i++) {
      schedule.push(<td key={this.props.route.route_short_name + '-schedule-' + i}>{routeInfo.schedule[i]}</td>);
    };
    scheduleRow =<tr><td>{this.props.route.route_short_name}</td>{schedule}</tr>
    table = <table>
              <thead>
                <tr>
                  <td></td>
                  <td colSpan='5'>Arki</td>
                  <td colSpan='4'>Lauantai</td>
                  <td colSpan='4'>Sunnuntai</td>
                </tr>
              </thead>
              <tbody>
                {timeRow}
                {scheduleRow}
              </tbody>
            </table>;
    return(
      <div>
          <div onClick={this.closeModal}>
            <Icon img='icon-icon_close' className='icon close'  fill='000'/>
          </div>
          <div className="modal-content">
            <h2>
              {this.props.route.route_short_name}
            </h2>
            <p>{routeInfo.route}</p>
            <p dangerouslySetInnerHTML={{__html:routeInfo.text}} />
            <h3>Vuorovälit ja liikennöintiajat (noin):</h3>
            {table}
          </div>
      </div>
    );
  }
});

