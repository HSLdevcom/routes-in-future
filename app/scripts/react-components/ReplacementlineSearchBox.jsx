
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