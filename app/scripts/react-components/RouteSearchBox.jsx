
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
      if((this.state.from.lat === 0 && this.state.from.lon === 0)||(this.state.to.lat === 0 && this.state.to.lon === 0)){
        this.clearSearch();
        return this.setState({showError:true});

      } else if(this.state.from.city !== 'Vantaa' && this.state.to.city !=='Vantaa') {
        this.setState({cantSearch: true, showError:false, searchResults: []});
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
              app.transitive.options.focusedJourney = '0_transit';
              app.showRoutesOnMap(transitivedata,'routesearch');
              //app.transitive.focusJourney('0_transit');
              
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
            
            var time = <div className='time clearfix'>
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
            var from = <h5 className="from-adress">{this.state.from.name}</h5>;
            var to = <h5 className="to-adress">{this.state.to.name}</h5>;
            return (<div className={clazz} onClick={this.focusJourney.bind(this,index)} >
                      {time}
                      <div className="result-inner">
                        {from}
                        <Icon img='icon-icon_walk' className='walk' fill='999'/>
                        {routes}
                        {to}
                      </div>
                    </div>);

          } else {
            return '';
          }

        },this);
        resultContent = <div className='result-content'>
          <h4 className='pre-heading'>Uudet reittivaihtoehtosi alkaen 10.8.2015</h4>
          <div onClick={this.clearSearch}>
            <Icon img='icon-icon_close' className='close' fill='999'/>
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
                            lähtö- tai pääteosoite tai –pysäkki täytyy olla muutosalueella
                          </p>
                          <p>
                            <a href={href} target='_blank'>Katso tämä reitti Reittioppaasta</a>
                          </p>
                        </div>;
      } 
      if(this.state.showError && this.props.isOpen){
        var href= 'http://www.reittiopas.fi?from_in='+this.state.from.name+'&to_in='+this.state.to.name+'&when=now&timetype=departure&hour='+this.state.linkHour+'&minute=00&daymonthyear='+this.state.linkDaymonthyear;
        errorContent =  <div className='error'>
                    <p>Valitse lähtö- ja pääteosoite tai -pysäkki kirjoittamisen yhteydessä näkyvästä listasta.</p>
                    <p>
                    </p>
                  </div>;
                  // <a href={href} target='_blank'>Katso tämä reitti Reittioppaasta</a>
      }
    
      return (
          <div className='route-search-form'>
            <form name='route-search-form'  className='route-form' onSubmit={this.searchRoutes}>
              <h3>Katso, muuttuuko reittisi:</h3>
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