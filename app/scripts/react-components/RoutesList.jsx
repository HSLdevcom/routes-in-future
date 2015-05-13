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