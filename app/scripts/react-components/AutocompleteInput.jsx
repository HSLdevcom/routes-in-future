
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
    } else {
      // if(this.state.suggestions.length>0){
      //   this.setState({value: this.state.suggestions[this.state.activeSuggestionIndex].suggestionText})
      // }
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
      if(this.state.activeSuggestionIndex>0) {
        this.setState({activeSuggestionIndex: (this.state.activeSuggestionIndex-1)});
      }
    } else if(e.keyCode === 40) {
      if(this.state.activeSuggestionIndex <=(this.state.suggestions.length-2) ){
        this.setState({activeSuggestionIndex: (this.state.activeSuggestionIndex+1)});
      }
    } else if(e.keyCode === 9) {
      this.setState({doNotBlur: false});
    }
  },
  componentDidUpdate: function() {
    var activeElement = $('.autocomplete-list .active');
    var acList = $('.autocomplete-list');
    if(activeElement.length>0) {
      if( activeElement.position().top > acList.height()){
        acList.scrollTop(this.state.activeSuggestionIndex*18);
      } else if(activeElement.position().top < acList.scrollTop()) {
        acList.scrollTop(this.state.activeSuggestionIndex*18);
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