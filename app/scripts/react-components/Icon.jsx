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