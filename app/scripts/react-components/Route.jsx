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