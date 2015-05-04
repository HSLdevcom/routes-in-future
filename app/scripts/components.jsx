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

    var html = '<svg '+id+' viewBox="0 0 40 40" class="icon '+clazz+'">'+
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
    render: function() {
        var classes = (this.props.route.active)? 'route clearfix active ' : 'route clearfix inactive ';
        var icon;
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
          <div className={classes} onClick={this.selectRoute}>
            <div className='checkmark-icon-nr'>
              <div className='checkmark'></div>
              {icon}
              <div className='route-nr'>{this.props.route.route_short_name}</div>
            </div>
            <div className='route-text'>{routeText}</div>
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
          return <Route route={route} isActive={route.isActive} selectRoute={this.selectRoute} key={route.route_id} />;
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
    $.get('http://77.95.145.186/geocoder/suggest/'+e.target.value)
    .then(function(data) {
      var suggestions = {}
      _.forEach(data.streetnames, function (obj, streetname) {
        obj.forEach(function (city) {
          city['name'] = streetname
          city['key'] = city.key.charAt(0).toUpperCase() + city.key.slice(1);
          suggestions[streetname + ', ' + city.key ] = city
        })
      })
      data.stops.forEach(function (stop) {
        suggestions[stop.stop_name + ' (' + stop.stop_code + ')'] = stop
      })
      _this.setState({
        suggestions: suggestions
      });

    });
  },
  setAdress: function(index){
    var suggestion = this.state.suggestions[index];
    if (suggestion.stop_name) {
      returnThis = {'lon': suggestion.location[0], 'lat': suggestion.location[1], name: index}
      if(suggestion.zone_id==4){
       returnThis.city = 'Vantaa'; 
      } else {
       returnThis.city = '0';  
      }
      this.setState({suggestions:[], value:index, autocompleteDone: true, result: returnThis});
    } else if (suggestion.key && suggestion.name) {
      $.get('http://77.95.145.186/geocoder/search/'+suggestion.key+'/'+suggestion.name).then(function(data){
        if (data.results.length == 1) {
          var result = data.results[0];
          var name = result.katunimi + (result.osoitenumero == 0 ? "": " " + result.osoitenumero ) + ', ' + result.kaupunki;
          returnThis = {'lon': data.results[0].location[0], 'lat': data.results[0].location[1], name: name}
          this.setState({suggestions:[], value:name, autocompleteDone: true, result: returnThis});
        } else {
          var suggestions = []
          var results = _.sortBy(data.results, 'osoitenumero')
          results.forEach(function (result) {
            suggestions.push(result)
          })
          this.setState({suggestions:suggestions, value:index, autocompleteDone: false})
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
      this.setState({suggestions:[], value:name, autocompleteDone: true, result: returnThis});
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
    if(Object.keys(this.state.suggestions).length) {
      var autocompleteListItems = _.map(this.state.suggestions, function(suggestion,key){
        if(suggestion.osoitenumero) {
          return <li onClick={this.setAdress.bind(this,key)} key={key}>{suggestion.katunimi} {suggestion.osoitenumero}{suggestion.kiinteiston_jakokirjain}, {suggestion.kaupunki}</li>;
        } else {
          return <li onClick={this.setAdress.bind(this,key)} key={key}>{key}</li>;
        }
      },this);
      autocompleteListItems.sort( function(a, b) {
        return (a.key.localeCompare(b.key))
      })
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
var RouteSearchBox = React.createClass({
    getInitialState: function() {
       return {
          focusedIndex: 0,
          cantSearch: false,
          cleared: false,
          searchResults:[],
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
        var maxWalkTime = 15;
        if(inputTimeofDay === 'morning') {
          startTime = '06:00';
          endTime = '11:00';
        } else if (inputTimeofDay === 'day'){
          startTime = '11:00';
          endTime = '15:00';
        } else if (inputTimeofDay === 'afternoon'){
          startTime = '15:00';
          endTime = '18:00';
        } else if (inputTimeofDay === 'evening'){
          startTime = '18:00';
          endTime = '23:59';
        } else if (inputTimeofDay === 'night'){
          startTime = '00:01';
          endTime = '05:00';
          maxWalkTime = 45;
        }

        if(inputDayOfTheWeek === 'weekday') {
          profileDate = '2015-08-26';
        } else if (inputTimeofDay === 'saturday'){
          profileDate = '2015-08-29';
        } else if (inputTimeofDay === 'sunday'){
          profileDate = '2015-08-30';
        }
        
        this.setState({cantSearch: false});
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
          //host: 'http://172.30.1.134:8080/otp/routers/helsinki',
          host: 'http://77.95.145.186/otp/routers/helsinki',
          limit: 5 // limit the number of options to profile, defaults to 3
        });
        profiler.profile(od, function(err, data) {
          var valid = [];
          var seen = [];
          var sorted = data.options.sort(function (a, b) {return(a.stats.avg-b.stats.avg)})
          sorted.map(function(option){
            var option = option;
            if(typeof option.transit!=='undefined') {
              if (!_.includes(seen, option.summary)){
                seen.push(option.summary);
                valid.push(option);
              }
            }
          });
          var validObj = {
            options: valid
          }
          _this.setState({searchResults : valid});
          if(err===null){

            od.profile = validObj;
            if(validObj.options.length) {
              profiler.journey(od,function(err,transitivedata) {
                showRoutesOnMap(transitivedata,'routesearch');
                transitive.focusJourney('0_transit');

              });

            }

          }

        });
      }
    },
    clearSearch: function(){
      this.props.clearActiveRoutes('route');
      this.setState({searchResults : [], cleared: !this.state.cleared, cantSearch: false});
    },
    focusJourney: function(index){
      transitive.focusJourney(index+'_transit');
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
            //<div className ='time'>{Math.floor(result.stats.min/60)} - {Math.floor(result.stats.max/60)}</div>
            var routes =  result.transit.map(function(transit){
                              return (
                                <div className='result-routes'>
                                    {transit.routes.map(function(route,index){
                                      var clazz = 'result-route ' + route.mode;
                                      var key = 'resultroute'+index;
                                      if(typeof route.shortName==='undefined') route.shortName = 'Metro';
                                      var txt = (index===(transit.routes.length-1))? route.shortName : route.shortName+' / ';
                                      return <h4 className={clazz} key={key}>{txt}</h4>;
                                    })}
                                </div>
                              );
                            });
            return (<div className={clazz} onClick={this.focusJourney.bind(this,index)} >{routes}{time}</div>);

          } else {
            return '';
          }

        },this);
        resultContent = <div className='result-content'>
          <h4 className='pre-heading'>Uudet reittisi</h4>
          <div onClick={this.clearSearch}>
            <Icon img='icon-icon_close' className='close' />
          </div>
          <div className='search-results' style={style}>
            {results}
          </div>
        </div>;
      }
      if(this.state.cantSearch && this.props.isOpen) {
        errorContent =  <div className='error'>
                          <h4>Kumpikaan osoitteista ei ole muutosalueella</h4>
                          <p>
                            Voit hakea reittisi <a href='http://www.reittiopas.fi' target='_blank'>reittioppaasta</a>
                          </p>
                        </div>;
      }
      return (
          <div className='route-search-form'>
            <form name='route-search-form'  onSubmit={this.searchRoutes}>
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
    return {newroutes: [], showAllRoutes: false, searching: false};
  },
  searchCurrentlines: function(e) {
    e.preventDefault();
    this.props.setActiveRoutes([]);
    var value = React.findDOMNode(this.refs.theLineNr).value;
    var _this = this;
    if(value!=='') {
      var oldLineId;
      var matches = _.filter(replacementLines,function(line){
        if(line.oldLines.indexOf(value)!==-1) return true;
      });
      if(matches.length>0){
        var routeInfos = [];
        var routeIds = [];
        var routeInfos =  matches.map(function(match) {
          var routeInfo = _.where(this.props.routes,{route_short_name:match.newLine})[0];
          routeIds.push(routeInfo.route_id);
          return routeInfo;
        },this);
        this.props.clearActiveRoutes('line');
        this.props.setActiveRoutes(routeIds);
        this.setState({newroutes: routeInfos, showAllRoutes: false, searching: true});

        oldRoute = _.find(oldRoutes,{shortName:value});
        new ConstructTransitiveData([oldRoute],'http://matka.hsl.fi/otp/routers/default/index/',function(data){
            showRoutesOnMap(data,'old');
           _this.setState({searching: false});
        });
      }
    }
  },
  showAllNewRoutes: function(e) {
    e.preventDefault();
    if(!this.state.searching) {
      React.findDOMNode(this.refs.theLineNr).value = '';
      this.props.clearActiveRoutes('line');
      if(this.state.showAllRoutes) {
        this.setState({newroutes: [], showAllRoutes: false});
      } else {
        this.setState({newroutes: this.props.routes, showAllRoutes: true});
      }
      
    }
  },
  setActiveRoutes: function(routeIds){
    this.props.setActiveRoutes(routeIds);
  },
  render: function() {
    var routes;
    if(this.state.newroutes.length && this.props.isOpen) {
      var heading = '';

      if(!this.state.showAllRoutes) {
        heading = <h4 className='pre-heading'>Korvaavat linjat</h4>;
      }

      routes = <div className='new-routes'>
                  {heading}
                  <RoutesList height={this.props.listHeight} setActiveRoutes={this.setActiveRoutes} routes={this.state.newroutes} />
                </div>;
    }
    

    return(
      <div className='line-search-form'>
        <form name='line-search-form'  onSubmit={this.searchCurrentlines}>
          <h3>Katso tulevat linjasi:</h3>
          <div className='form-group'>
            <input autoComplete='off' type='text' ref='theLineNr' name='current-linenr' placeholder='Nykyinen linjanumero' />
            <button type='submit'>Hae</button>
          </div>
          <a href='#show-all-new' onClick={this.showAllNewRoutes}>{(this.state.showAllRoutes && this.props.isOpen)? 'Piillota kaikki uudet linjat' :'Näytä kaikki uudet linjat'} <small>&gt;</small></a>
        </form>
        {routes}
      </div>
    );
  }
});

var LeftSidebar = React.createClass({
  getInitialState: function(){
    return {DATA:DATA,listHeight: 0, open: 'route'};
  },
  clearActiveRoutes: function(searchToShow){
    DATA.routes = DATA.routes.map(function(route){
      route.active = false;
      return route;
    });
    this.setState({DATA:DATA, open: searchToShow});
    clearRoutesOnMap();
  },
  setActiveRoutes:function(routeIds) {
    DATA.routes = DATA.routes.map(function(route){
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
    this.setState({DATA:DATA});
    showRoutesOnMap(DATA,'new');
  },
  handleResize: function(e) {
    var listHeight = document.querySelectorAll('.route-search-form')[0].offsetHeight;
    listHeight += document.querySelectorAll('.line-search-form')[0].offsetHeight;
    listHeight += document.querySelectorAll('.info')[0].offsetHeight;
    listHeight += document.querySelectorAll('.footer')[0].offsetHeight;
    if(listHeight>window.innerHeight){
      document.getElementsByClassName('left-sidebar')[0].style.overflow = 'auto';
      listHeight = 300;
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
React.render(<LeftSidebar data={DATA} />, document.getElementById('sidebar'));
