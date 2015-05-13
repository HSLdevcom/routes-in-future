
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