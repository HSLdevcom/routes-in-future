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
          <div className={classes} onClick={this.props.onClick}>
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
          var boundClick = this.selectRoute.bind(this, route.route_id);
          return <Route route={route} isActive={route.isActive} onClick={boundClick} key={route.route_id} />;
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
var RouteSearchBox = React.createClass({
    getInitialState: function() {
       return {
          searchResults:[],
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
                name:result.street+' '+result.nr,
                lat:data.hits.hits[0]._source.location[1],
                lon:data.hits.hits[0]._source.location[0]
              }
            });
          } else if(type==='to') {
            _this.setState({
              to:{
                name:result.street+' '+result.nr,
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
      this.props.clearActiveRoutes('route');
      e.preventDefault();
      var _this = this;
      var od = {
        from: this.state.from,
        to: this.state.to,
        accessModes: 'WALK',
        egressModes: 'WALK',
        directModes: '',
        suboptimal: 0,
        transitModes: 'TRANSIT',
        date: '2015-08-27'
      };
      var profiler = new OtpProfiler({
        host: 'http://172.30.1.134:8080/otp/routers/helsinki',
        limit: 5 // limit the number of options to profile, defaults to 3
      });
      profiler.profile(od, function(err, data) {
        var valid = [];
        data.options.map(function(option){
          var option = option;
          if(typeof option.transit!=='undefined') {
            option.transit.map(function(transit){
              transit.routes.map(function(route){
                if(_.where(replacementLines,{newLine:route.shortName}).length) {
                  valid.push(option);
                }
              });
            });
          }
        });
        var validObj = {
          options: valid
        }
        _this.setState({searchResults : data.options});
        if(err===null){

          od.profile = validObj;
          profiler.journey(od,function(err,transitivedata) {
            showRoutesOnMap(transitivedata,'routesearch');
          });
        }
      });
    },
    focusJourney: function(index){
      transitive.focusJourney(index+'_transit');
    },
    blurJourney: function(){
      transitive.focusJourney();
    },
    render: function() {
      var results;
      if(this.state.searchResults.length) {

        results = this.state.searchResults.map(function(result, index) {
          if(result.summary!=='Non-transit options') {
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
                                      if(typeof route.shortName==='undefined') route.shortName = 'Metro';
                                      var txt = (index===(transit.routes.length-1))? route.shortName : route.shortName+' / ';
                                      return <h4 className={clazz}>{txt}</h4>;
                                    })}
                                </div>
                              );
                            });
            return (<div className='result' onMouseLeave={this.blurJourney} onMouseEnter={this.focusJourney.bind(this,index)}>{routes}{time}</div>);

          } else {
            return '';
          }

        },this);
      }
      var style = {};
      if(this.props.listHeight) {
        style.maxHeight = this.props.listHeight+'px';
      }
      return (
          <div className='route-search-form'>
            <form name='route-search-form'  onSubmit={this.searchRoutes}>
              <h3>Katso, muuttuuko reittisi.</h3>
              <AutocompleteInput  name='from' placeholder='Mistä?' setResult={this.setResult}/>
              <AutocompleteInput  name='to' placeholder='Mihin?' setResult={this.setResult}/>
              <div className='form-group'>
                <button type='submit'>Hae</button>
              </div>
            </form>
            <div className='search-results' style={style}>
              {results}
            </div>
          </div>
        );
    }
});
var ReplacementLineSearch = React.createClass({
  getInitialState: function() {
    return {newroutes: [], showAllRoutes: false};
  },
  searchCurrentlines: function(e) {
    e.preventDefault();
    this.props.setActiveRoutes([]);
    this.setState({newroutes:[]});
    var value = React.findDOMNode(this.refs.theLineNr).value;
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
        this.setState({newroutes: routeInfos, showAllRoutes: false});

        oldRoute = _.find(oldRoutes,{shortName:value});
        new ConstructTransitiveData([oldRoute],'http://matka.hsl.fi/otp/routers/default/index/',function(data){
          showRoutesOnMap(data,'old');
        });
      }
    }
  },
  showAllNewRoutes: function(e) {
    e.preventDefault();
    this.props.clearActiveRoutes('line');
    if(this.state.showAllRoutes) {
      this.setState({newroutes: [], showAllRoutes: false});
    } else {
      this.setState({newroutes: this.props.routes, showAllRoutes: true});
    }
  },
  setActiveRoutes: function(routeIds){
    this.props.setActiveRoutes(routeIds);
  },
  render: function() {
    var routes;
    if(this.state.newroutes.length && this.props.isOpen) {
      
      routes = <div className='new-routes'>
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
    showRoutesOnMap(DATA,'new');
    showRoutesOnMap(DATA,'old');
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
