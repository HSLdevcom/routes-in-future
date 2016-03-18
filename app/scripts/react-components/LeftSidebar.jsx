
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
    // listHeight += document.querySelectorAll('.line-form')[0].offsetHeight;
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
        {/*<ReplacementLineSearch
          isOpen={(this.state.open==='line')?true:false}
          listHeight={this.state.listHeight}
          setActiveRoutes={this.setActiveRoutes}
          clearActiveRoutes={this.clearActiveRoutes}
          routes={this.state.DATA.routes} />*/}
      </div>
    );
  }
});
